use std::path::{Path, PathBuf};

#[cfg(any(target_os = "windows", test))]
use std::collections::HashSet;
#[cfg(target_os = "windows")]
use std::sync::{Mutex, OnceLock};

use sysinfo::{ProcessesToUpdate, System};

use crate::{error::StylerError, model::CodexDetection};

#[cfg(not(target_os = "windows"))]
const GRACEFUL_QUIT_POLLS: usize = 16;
#[cfg(target_os = "windows")]
const GRACEFUL_QUIT_POLLS: usize = 6;
#[cfg(target_os = "windows")]
const FORCED_QUIT_POLLS: usize = 12;
const QUIT_POLL_INTERVAL: std::time::Duration = std::time::Duration::from_millis(250);
#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;
#[cfg(target_os = "windows")]
const WINDOWS_HELPER_TIMEOUT: std::time::Duration = std::time::Duration::from_millis(1_500);
#[cfg(target_os = "windows")]
const WINDOWS_QUERY_TIMEOUT: std::time::Duration = std::time::Duration::from_secs(4);

#[cfg(target_os = "windows")]
static WINDOWS_STORE_INSTALL_CACHE: OnceLock<Mutex<Option<PathBuf>>> = OnceLock::new();

#[cfg(target_os = "windows")]
fn hidden_tokio_command(program: &str) -> tokio::process::Command {
    let mut command = tokio::process::Command::new(program);
    command.creation_flags(CREATE_NO_WINDOW);
    command.kill_on_drop(true);
    command
}

#[cfg(target_os = "windows")]
fn hidden_command(program: &str) -> std::process::Command {
    use std::os::windows::process::CommandExt;

    let mut command = std::process::Command::new(program);
    command.creation_flags(CREATE_NO_WINDOW);
    command
}

#[cfg(target_os = "windows")]
fn hidden_command_output(
    program: &str,
    arguments: &[&str],
    timeout: std::time::Duration,
) -> Option<std::process::Output> {
    let mut command = hidden_command(program);
    command
        .args(arguments)
        .stdin(std::process::Stdio::null())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::null());
    let mut child = command.spawn().ok()?;
    let deadline = std::time::Instant::now() + timeout;
    loop {
        match child.try_wait() {
            Ok(Some(_)) => return child.wait_with_output().ok(),
            Ok(None) if std::time::Instant::now() < deadline => {
                std::thread::sleep(std::time::Duration::from_millis(20));
            }
            Ok(None) | Err(_) => {
                let _ = child.kill();
                let _ = child.wait();
                return None;
            }
        }
    }
}

pub async fn quit_codex(custom_path: Option<&Path>) -> Result<CodexDetection, StylerError> {
    let initial = detect_codex(custom_path)?;
    if !initial.running {
        return Ok(initial);
    }
    let detected_path = initial.path.as_deref().map(PathBuf::from);
    let lifecycle_path = detected_path.as_deref().or(custom_path);

    #[cfg(target_os = "macos")]
    {
        let status = tokio::process::Command::new("/usr/bin/osascript")
            .args(["-e", "tell application id \"com.openai.codex\" to quit"])
            .status()
            .await
            .map_err(|error| StylerError::Launch(error.to_string()))?;
        if !status.success() {
            return Err(StylerError::Launch(
                "Codex did not accept the standard quit request".into(),
            ));
        }
    }

    #[cfg(target_os = "windows")]
    // Windows Store apps sometimes treat WM_CLOSE as minimize and a shell
    // helper can itself stall. Both attempts are best-effort and bounded; the
    // verified process scan below remains the source of truth.
    request_windows_close(lifecycle_path).await;

    if let Some(detection) = wait_until_closed(lifecycle_path, GRACEFUL_QUIT_POLLS).await? {
        return Ok(detection);
    }

    #[cfg(target_os = "windows")]
    {
        // The packaged Windows app currently treats WM_CLOSE as hide/minimize.
        // The user has explicitly confirmed a restart, so terminate only the
        // verified Codex UI process tree after the graceful request times out.
        force_close_windows_codex(lifecycle_path).await;
        if let Some(detection) = wait_until_closed(lifecycle_path, FORCED_QUIT_POLLS).await? {
            return Ok(detection);
        }
    }

    Err(StylerError::Launch(
        "Codex is still running. Save any work and close it manually, then try again".into(),
    ))
}

async fn wait_until_closed(
    custom_path: Option<&Path>,
    polls: usize,
) -> Result<Option<CodexDetection>, StylerError> {
    for _ in 0..polls {
        let detection = detect_codex(custom_path)?;
        if !detection.running {
            return Ok(Some(detection));
        }
        tokio::time::sleep(QUIT_POLL_INTERVAL).await;
    }
    Ok(None)
}

#[cfg(target_os = "windows")]
async fn request_windows_close(custom_path: Option<&Path>) {
    let processes = desktop_processes(custom_path);
    let pids = root_process_ids(&processes)
        .into_iter()
        .map(|pid| pid.to_string())
        .collect::<Vec<_>>();
    if pids.is_empty() {
        return;
    }
    let command = format!(
        "$p = Get-Process -Id {} -ErrorAction SilentlyContinue; if ($p) {{ $p.CloseMainWindow() | Out-Null }}",
        pids.join(",")
    );
    let mut process = hidden_tokio_command("powershell.exe");
    process.args(["-NoProfile", "-NonInteractive", "-Command", &command]);
    let _ = tokio::time::timeout(WINDOWS_HELPER_TIMEOUT, process.output()).await;
}

#[cfg(target_os = "windows")]
async fn force_close_windows_codex(custom_path: Option<&Path>) {
    let processes = desktop_processes(custom_path);
    let attempts = root_process_ids(&processes)
        .into_iter()
        .map(|pid| async move {
            let mut process = hidden_tokio_command("taskkill.exe");
            process.args(["/PID", &pid.to_string(), "/T", "/F"]);
            tokio::time::timeout(WINDOWS_HELPER_TIMEOUT, process.output()).await
        });
    // Kill independent roots concurrently instead of opening a visible,
    // sequential taskkill chain. Races with processes already exiting are
    // expected; the subsequent verified process scan decides success.
    let _ = futures_util::future::join_all(attempts).await;
}

pub fn detect_codex(custom_path: Option<&Path>) -> Result<CodexDetection, StylerError> {
    let located_path = locate_codex(custom_path);
    let processes = desktop_processes(located_path.as_deref().or(custom_path));
    let running_path = processes.iter().find_map(|(_, _, path)| path.clone());
    let path = located_path.or(running_path);

    Ok(CodexDetection {
        installed: path.is_some(),
        running: !processes.is_empty(),
        version: path.as_deref().and_then(read_version),
        path: path.map(|value| value.to_string_lossy().to_string()),
        platform: std::env::consts::OS.into(),
    })
}

fn desktop_processes(install_path: Option<&Path>) -> Vec<(u32, Option<u32>, Option<PathBuf>)> {
    let expected_executable = install_path.and_then(executable_from_install);
    let mut system = System::new();
    system.refresh_processes(ProcessesToUpdate::All, true);
    system
        .processes()
        .values()
        .filter_map(|process| {
            let executable = process.exe()?;
            let is_expected = expected_executable
                .as_deref()
                .is_some_and(|expected| paths_equal(expected, executable));
            if !is_expected && !is_discoverable_desktop_executable(executable) {
                return None;
            }
            Some((
                process.pid().as_u32(),
                process.parent().map(|pid| pid.as_u32()),
                install_root_from_executable(executable),
            ))
        })
        .collect()
}

#[cfg(any(target_os = "windows", test))]
fn root_process_ids(processes: &[(u32, Option<u32>, Option<PathBuf>)]) -> Vec<u32> {
    let matched = processes
        .iter()
        .map(|(pid, _, _)| *pid)
        .collect::<HashSet<_>>();
    processes
        .iter()
        .filter(|(_, parent, _)| parent.is_none_or(|pid| !matched.contains(&pid)))
        .map(|(pid, _, _)| *pid)
        .collect()
}

fn paths_equal(left: &Path, right: &Path) -> bool {
    #[cfg(target_os = "windows")]
    {
        left.to_string_lossy()
            .eq_ignore_ascii_case(right.to_string_lossy().as_ref())
    }
    #[cfg(not(target_os = "windows"))]
    {
        left == right
    }
}

fn install_root_from_executable(executable: &Path) -> Option<PathBuf> {
    #[cfg(target_os = "macos")]
    {
        executable.ancestors().nth(3).map(Path::to_path_buf)
    }
    #[cfg(target_os = "windows")]
    {
        Some(executable.to_path_buf())
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        let _ = executable;
        None
    }
}

fn is_discoverable_desktop_executable(executable: &Path) -> bool {
    #[cfg(target_os = "macos")]
    {
        install_root_from_executable(executable)
            .as_deref()
            .is_some_and(is_codex_bundle)
    }
    #[cfg(target_os = "windows")]
    {
        is_supported_windows_desktop_path(executable)
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        let _ = executable;
        false
    }
}

#[cfg(any(target_os = "windows", test))]
fn is_supported_windows_desktop_path(executable: &Path) -> bool {
    let normalized = executable.to_string_lossy().replace('/', "\\");
    let lower = normalized.to_ascii_lowercase();
    let filename = lower.rsplit('\\').next().unwrap_or_default();
    (filename == "codex.exe" || filename == "chatgpt.exe")
        && !lower.contains("\\resources\\")
        && (lower.contains("\\windowsapps\\openai.codex_")
            || lower.contains("\\windowsapps\\openai.chatgpt")
            || lower.contains("\\programs\\codex\\")
            || lower.contains("\\programs\\chatgpt\\")
            || lower.contains("\\codex\\codex.exe")
            || lower.contains("\\chatgpt\\chatgpt.exe"))
}

#[cfg(any(target_os = "windows", test))]
pub fn is_windows_store_install(executable: &Path) -> bool {
    executable
        .to_string_lossy()
        .replace('/', "\\")
        .to_ascii_lowercase()
        .contains("\\program files\\windowsapps\\")
}

#[cfg(any(target_os = "windows", test))]
fn windows_store_package_family(executable: &Path) -> Option<String> {
    if !is_windows_store_install(executable) {
        return None;
    }
    let normalized = executable.to_string_lossy().replace('/', "\\");
    let lower = normalized.to_ascii_lowercase();
    let marker = "\\program files\\windowsapps\\";
    let package_offset = lower.find(marker)? + marker.len();
    let package_folder = normalized[package_offset..].split('\\').next()?;
    let package_name = package_folder.split('_').next()?;
    let publisher_id = package_folder.rsplit('_').next()?;
    if !(package_name.eq_ignore_ascii_case("OpenAI.Codex")
        || package_name.eq_ignore_ascii_case("OpenAI.ChatGPT"))
        || publisher_id.is_empty()
        || !publisher_id
            .chars()
            .all(|character| character.is_ascii_alphanumeric())
    {
        return None;
    }
    Some(format!("{package_name}_{publisher_id}"))
}

#[cfg(any(target_os = "windows", test))]
fn windows_store_fallback_app_user_model_ids(executable: &Path) -> Vec<String> {
    let Some(family) = windows_store_package_family(executable) else {
        return Vec::new();
    };
    ["App", "Codex", "ChatGPT", "Desktop"]
        .into_iter()
        .map(|app_id| format!("{family}!{app_id}"))
        .collect()
}

#[cfg(target_os = "windows")]
pub fn windows_store_app_user_model_ids(executable: &Path) -> Vec<String> {
    if !is_windows_store_install(executable) {
        return Vec::new();
    }
    let target_path = executable.to_string_lossy().replace('\'', "''");
    let family_hint = windows_store_package_family(executable).unwrap_or_default();
    let package_name = family_hint
        .split('_')
        .next()
        .unwrap_or_default()
        .replace('\'', "''");
    let family_hint = family_hint.replace('\'', "''");
    let script = format!(
        "$target = [IO.Path]::GetFullPath('{target_path}'); $familyHint = '{family_hint}'; $packageName = '{package_name}'; if ($familyHint) {{ Get-StartApps -ErrorAction SilentlyContinue | Where-Object {{ $_.AppID -like ($familyHint + '!*') }} | ForEach-Object {{ Write-Output ([string]$_.AppID) }} }}; $packageCandidates = if ($packageName) {{ @(Get-AppxPackage -Name $packageName -ErrorAction SilentlyContinue) }} else {{ @(Get-AppxPackage -ErrorAction SilentlyContinue) }}; $packages = @($packageCandidates | Where-Object {{ $root = [IO.Path]::GetFullPath([string]$_.InstallLocation).TrimEnd('\\'); ($root -and $target.StartsWith($root + '\\', [StringComparison]::OrdinalIgnoreCase)) -or ($familyHint -and $_.PackageFamilyName -ieq $familyHint) }} | Sort-Object Version -Descending); foreach ($p in $packages) {{ $family = [string]$p.PackageFamilyName; $startApps = @(Get-StartApps -ErrorAction SilentlyContinue | Where-Object {{ $_.AppID -like ($family + '!*') }}); foreach ($entry in $startApps) {{ if ([string]$entry.Name -match 'Codex|ChatGPT') {{ Write-Output ([string]$entry.AppID) }} }}; $manifest = Get-AppxPackageManifest -Package $p.PackageFullName -ErrorAction SilentlyContinue; $apps = @($manifest.Package.Applications.Application); foreach ($app in $apps) {{ $appId = [string]$app.Id; $appExecutable = [string]$app.Executable; if (-not $appId) {{ continue }}; $resolved = if ($appExecutable -and -not $appExecutable.Contains('$targetnametoken$')) {{ [IO.Path]::GetFullPath((Join-Path $p.InstallLocation $appExecutable)) }} else {{ '' }}; if (($resolved -and $resolved.Equals($target, [StringComparison]::OrdinalIgnoreCase)) -or ([IO.Path]::GetFileName($appExecutable) -ieq [IO.Path]::GetFileName($target))) {{ Write-Output ($family + '!' + $appId) }} }}; if ($apps.Count -eq 1 -and [string]$apps[0].Id) {{ Write-Output ($family + '!' + [string]$apps[0].Id) }}; foreach ($entry in $startApps) {{ Write-Output ([string]$entry.AppID) }} }}"
    );
    let output = hidden_command_output(
        "powershell.exe",
        &["-NoProfile", "-NonInteractive", "-Command", &script],
        WINDOWS_QUERY_TIMEOUT,
    );
    let mut candidates = Vec::new();
    if let Some(output) = output.filter(|result| result.status.success()) {
        for line in String::from_utf8_lossy(&output.stdout).lines() {
            let candidate = line.trim();
            if candidate.contains('!')
                && !candidate.chars().any(char::is_whitespace)
                && !candidates.iter().any(|existing| existing == candidate)
            {
                candidates.push(candidate.to_string());
            }
        }
    }
    for candidate in windows_store_fallback_app_user_model_ids(executable) {
        if !candidates.contains(&candidate) {
            candidates.push(candidate);
        }
    }
    candidates
}

fn read_version(path: &Path) -> Option<String> {
    #[cfg(target_os = "macos")]
    {
        read_plist_value(path, "CFBundleShortVersionString")
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = path;
        None
    }
}

#[cfg(target_os = "macos")]
fn read_plist_value(path: &Path, key: &str) -> Option<String> {
    let plist = path.join("Contents/Info.plist");
    let output = std::process::Command::new("/usr/bin/defaults")
        .args(["read", plist.to_string_lossy().as_ref(), key])
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    let value = String::from_utf8_lossy(&output.stdout).trim().to_string();
    (!value.is_empty()).then_some(value)
}

#[cfg(target_os = "macos")]
fn is_codex_bundle(path: &Path) -> bool {
    if !path.exists() {
        return false;
    }
    let expected_name = path
        .file_name()
        .and_then(|name| name.to_str())
        .is_some_and(|name| name == "Codex.app" || name == "ChatGPT.app");
    expected_name
        && (path.file_name().is_some_and(|name| name == "Codex.app")
            || read_plist_value(path, "CFBundleIdentifier").as_deref() == Some("com.openai.codex"))
}

fn locate_codex(custom_path: Option<&Path>) -> Option<PathBuf> {
    if let Some(path) = custom_path.and_then(normalize_install_path) {
        return Some(path);
    }

    #[cfg(target_os = "macos")]
    {
        let mut candidates = vec![
            PathBuf::from("/Applications/Codex.app"),
            PathBuf::from("/Applications/ChatGPT.app"),
        ];
        if let Some(home) = std::env::var_os("HOME") {
            let home = PathBuf::from(home);
            candidates.push(home.join("Applications/Codex.app"));
            candidates.push(home.join("Applications/ChatGPT.app"));
        }
        candidates.into_iter().find(|path| is_codex_bundle(path))
    }

    #[cfg(target_os = "windows")]
    {
        let mut candidates = windows_standard_candidates();
        if let Some(store_path) = windows_store_install() {
            // Prefer a directly executable per-user or system installation.
            // Store packages remain the automatic fallback and are activated
            // through their registered application identity at launch time.
            candidates.push(store_path);
        }
        candidates.into_iter().find(|path| path.exists())
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        None
    }
}

fn normalize_install_path(path: &Path) -> Option<PathBuf> {
    #[cfg(target_os = "macos")]
    {
        if is_codex_bundle(path) {
            return Some(path.to_path_buf());
        }
        let root = install_root_from_executable(path)?;
        is_codex_bundle(&root).then_some(root)
    }
    #[cfg(target_os = "windows")]
    {
        executable_from_install(path).map(|_| path.to_path_buf())
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        let _ = path;
        None
    }
}

pub fn validate_install_path(path: &Path) -> bool {
    normalize_install_path(path).is_some()
}

#[cfg(target_os = "windows")]
fn windows_standard_candidates() -> Vec<PathBuf> {
    let mut candidates = Vec::new();
    if let Some(local) = std::env::var_os("LOCALAPPDATA") {
        let local = PathBuf::from(local);
        candidates.push(local.join("Programs/Codex/Codex.exe"));
        candidates.push(local.join("Codex/Codex.exe"));
        candidates.push(local.join("Programs/ChatGPT/ChatGPT.exe"));
        candidates.push(local.join("ChatGPT/ChatGPT.exe"));
    }
    for variable in ["ProgramFiles", "ProgramFiles(x86)"] {
        if let Some(program_files) = std::env::var_os(variable) {
            let program_files = PathBuf::from(program_files);
            candidates.push(program_files.join("Codex/Codex.exe"));
            candidates.push(program_files.join("ChatGPT/ChatGPT.exe"));
        }
    }
    candidates
}

#[cfg(target_os = "windows")]
fn windows_store_install() -> Option<PathBuf> {
    let cache = WINDOWS_STORE_INSTALL_CACHE.get_or_init(|| Mutex::new(None));
    if let Some(cached) = cache
        .lock()
        .ok()
        .and_then(|cached| cached.as_ref().filter(|path| path.exists()).cloned())
    {
        return Some(cached);
    }
    let script = "$packages = Get-AppxPackage -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '^OpenAI\\.(Codex|ChatGPT)' } | Sort-Object Version -Descending; foreach ($p in $packages) { $candidates = @((Join-Path $p.InstallLocation 'app\\Codex.exe'), (Join-Path $p.InstallLocation 'app\\ChatGPT.exe'), (Join-Path $p.InstallLocation 'ChatGPT.exe')); foreach ($candidate in $candidates) { if (Test-Path $candidate) { Write-Output $candidate; exit 0 } } }";
    let output = hidden_command_output(
        "powershell.exe",
        &["-NoProfile", "-NonInteractive", "-Command", script],
        WINDOWS_QUERY_TIMEOUT,
    )?;
    if !output.status.success() {
        return None;
    }
    let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let path = (!path.is_empty()).then(|| PathBuf::from(path))?;
    if let Ok(mut cached) = cache.lock() {
        *cached = Some(path.clone());
    }
    Some(path)
}

pub fn executable_from_install(path: &Path) -> Option<PathBuf> {
    #[cfg(target_os = "macos")]
    {
        let executable_name =
            read_plist_value(path, "CFBundleExecutable").unwrap_or_else(|| "Codex".to_string());
        let executable = path.join("Contents/MacOS").join(executable_name);
        executable.exists().then_some(executable)
    }

    #[cfg(target_os = "windows")]
    {
        let filename = path
            .file_name()
            .and_then(|value| value.to_str())
            .unwrap_or_default();
        (path.exists()
            && (filename.eq_ignore_ascii_case("Codex.exe")
                || filename.eq_ignore_ascii_case("ChatGPT.exe")))
        .then_some(path.to_path_buf())
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        let _ = path;
        None
    }
}

#[cfg(test)]
mod tests {
    use super::{
        executable_from_install, is_supported_windows_desktop_path, is_windows_store_install,
        root_process_ids, windows_store_fallback_app_user_model_ids, windows_store_package_family,
    };
    use std::path::{Path, PathBuf};

    #[test]
    fn missing_install_has_no_executable() {
        assert!(executable_from_install(Path::new("/definitely/missing/codex")).is_none());
    }

    #[test]
    fn recognizes_windows_store_desktop_executable() {
        let executable = Path::new(
            r"C:\Program Files\WindowsApps\OpenAI.Codex_26.616.5445.0_x64__2p2nqsd0c76g0\app\Codex.exe",
        );
        assert!(is_supported_windows_desktop_path(executable));
        assert!(is_windows_store_install(executable));
        assert_eq!(
            windows_store_package_family(executable).as_deref(),
            Some("OpenAI.Codex_2p2nqsd0c76g0")
        );
        assert_eq!(
            windows_store_fallback_app_user_model_ids(executable),
            vec![
                "OpenAI.Codex_2p2nqsd0c76g0!App",
                "OpenAI.Codex_2p2nqsd0c76g0!Codex",
                "OpenAI.Codex_2p2nqsd0c76g0!ChatGPT",
                "OpenAI.Codex_2p2nqsd0c76g0!Desktop",
            ]
        );
    }

    #[test]
    fn rejects_codex_resource_and_cli_processes() {
        assert!(!is_supported_windows_desktop_path(Path::new(
            r"C:\Program Files\WindowsApps\OpenAI.Codex_26.616.5445.0_x64__2p2nqsd0c76g0\app\resources\codex.exe"
        )));
        assert!(!is_supported_windows_desktop_path(Path::new(
            r"C:\Users\developer\bin\codex.exe"
        )));
    }

    #[test]
    fn selects_only_process_tree_roots_for_windows_shutdown() {
        let processes = vec![
            (100, None, Some(PathBuf::from("Codex.exe"))),
            (101, Some(100), Some(PathBuf::from("Codex.exe"))),
            (102, Some(101), Some(PathBuf::from("Codex.exe"))),
            (200, None, Some(PathBuf::from("Codex.exe"))),
        ];
        assert_eq!(root_process_ids(&processes), vec![100, 200]);
    }
}
