use std::path::{Path, PathBuf};

use sysinfo::{ProcessesToUpdate, System};

use crate::{error::StylerError, model::CodexDetection};

const GRACEFUL_QUIT_POLLS: usize = 16;
#[cfg(target_os = "windows")]
const FORCED_QUIT_POLLS: usize = 20;
const QUIT_POLL_INTERVAL: std::time::Duration = std::time::Duration::from_millis(250);

pub async fn quit_codex(custom_path: Option<&Path>) -> Result<CodexDetection, StylerError> {
    let initial = detect_codex(custom_path)?;
    if !initial.running {
        return Ok(initial);
    }

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
    request_windows_close(custom_path).await?;

    if let Some(detection) = wait_until_closed(custom_path, GRACEFUL_QUIT_POLLS).await? {
        return Ok(detection);
    }

    #[cfg(target_os = "windows")]
    {
        // The packaged Windows app currently treats WM_CLOSE as hide/minimize.
        // The user has explicitly confirmed a restart, so terminate only the
        // verified Codex UI process tree after the graceful request times out.
        force_close_windows_codex(custom_path).await?;
        if let Some(detection) = wait_until_closed(custom_path, FORCED_QUIT_POLLS).await? {
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
async fn request_windows_close(custom_path: Option<&Path>) -> Result<(), StylerError> {
    let pids = desktop_processes(custom_path)
        .into_iter()
        .map(|(pid, _)| pid.to_string())
        .collect::<Vec<_>>();
    if pids.is_empty() {
        return Ok(());
    }
    let command = format!(
        "$p = Get-Process -Id {} -ErrorAction SilentlyContinue; if ($p) {{ $p.CloseMainWindow() | Out-Null }}",
        pids.join(",")
    );
    let status = tokio::process::Command::new("powershell.exe")
        .args(["-NoProfile", "-NonInteractive", "-Command", &command])
        .status()
        .await
        .map_err(|error| StylerError::Launch(error.to_string()))?;
    if status.success() {
        Ok(())
    } else {
        Err(StylerError::Launch(
            "Codex did not accept the standard close request".into(),
        ))
    }
}

#[cfg(target_os = "windows")]
async fn force_close_windows_codex(custom_path: Option<&Path>) -> Result<(), StylerError> {
    for (pid, _) in desktop_processes(custom_path) {
        let status = tokio::process::Command::new("taskkill.exe")
            .args(["/PID", &pid.to_string(), "/T", "/F"])
            .status()
            .await
            .map_err(|error| StylerError::Launch(error.to_string()))?;
        // A process may exit between enumeration and taskkill. Continue and
        // let the subsequent detection decide whether restart can proceed.
        let _ = status;
    }
    Ok(())
}

pub fn detect_codex(custom_path: Option<&Path>) -> Result<CodexDetection, StylerError> {
    let located_path = locate_codex(custom_path);
    let processes = desktop_processes(located_path.as_deref().or(custom_path));
    let running_path = processes.iter().find_map(|(_, path)| path.clone());
    let path = located_path.or(running_path);

    Ok(CodexDetection {
        installed: path.is_some(),
        running: !processes.is_empty(),
        version: path.as_deref().and_then(read_version),
        path: path.map(|value| value.to_string_lossy().to_string()),
        platform: std::env::consts::OS.into(),
    })
}

fn desktop_processes(install_path: Option<&Path>) -> Vec<(u32, Option<PathBuf>)> {
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
                install_root_from_executable(executable),
            ))
        })
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
            candidates.insert(0, store_path);
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
    let script = "$packages = Get-AppxPackage -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '^OpenAI\\.(Codex|ChatGPT)' } | Sort-Object Version -Descending; foreach ($p in $packages) { $candidates = @((Join-Path $p.InstallLocation 'app\\Codex.exe'), (Join-Path $p.InstallLocation 'app\\ChatGPT.exe'), (Join-Path $p.InstallLocation 'ChatGPT.exe')); foreach ($candidate in $candidates) { if (Test-Path $candidate) { Write-Output $candidate; exit 0 } } }";
    let output = std::process::Command::new("powershell.exe")
        .args(["-NoProfile", "-NonInteractive", "-Command", script])
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
    (!path.is_empty()).then(|| PathBuf::from(path))
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
    use super::{executable_from_install, is_supported_windows_desktop_path};
    use std::path::Path;

    #[test]
    fn missing_install_has_no_executable() {
        assert!(executable_from_install(Path::new("/definitely/missing/codex")).is_none());
    }

    #[test]
    fn recognizes_windows_store_desktop_executable() {
        assert!(is_supported_windows_desktop_path(Path::new(
            r"C:\Program Files\WindowsApps\OpenAI.Codex_26.616.5445.0_x64__2p2nqsd0c76g0\app\Codex.exe"
        )));
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
}
