use std::path::{Path, PathBuf};

use sysinfo::{ProcessesToUpdate, System};

use crate::{error::StylerError, model::CodexDetection};

pub fn detect_codex() -> Result<CodexDetection, StylerError> {
    let path = locate_codex();
    let mut system = System::new();
    system.refresh_processes(ProcessesToUpdate::All, true);
    let running = system.processes().values().any(|process| {
        let name = process.name().to_string_lossy().to_ascii_lowercase();
        if name == "codex" || name == "codex.exe" {
            return true;
        }

        #[cfg(target_os = "macos")]
        {
            name == "chatgpt"
                && process.exe().is_some_and(|executable| {
                    executable
                        .to_string_lossy()
                        .contains("/ChatGPT.app/Contents/MacOS/ChatGPT")
                })
        }
        #[cfg(target_os = "windows")]
        {
            name == "chatgpt.exe"
        }
        #[cfg(not(any(target_os = "macos", target_os = "windows")))]
        {
            false
        }
    });

    Ok(CodexDetection {
        installed: path.is_some(),
        running,
        version: path.as_deref().and_then(read_version),
        path: path.map(|value| value.to_string_lossy().to_string()),
        platform: std::env::consts::OS.into(),
    })
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
    path.file_name().is_some_and(|name| name == "Codex.app")
        || read_plist_value(path, "CFBundleIdentifier").as_deref() == Some("com.openai.codex")
}

fn locate_codex() -> Option<PathBuf> {
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
        let mut candidates = Vec::new();
        if let Some(local) = std::env::var_os("LOCALAPPDATA") {
            candidates.push(PathBuf::from(local).join("Programs/Codex/Codex.exe"));
            candidates.push(PathBuf::from(local).join("Codex/Codex.exe"));
            candidates.push(PathBuf::from(local).join("Programs/ChatGPT/ChatGPT.exe"));
            candidates.push(PathBuf::from(local).join("ChatGPT/ChatGPT.exe"));
        }
        if let Some(program_files) = std::env::var_os("ProgramFiles") {
            candidates.push(PathBuf::from(program_files).join("Codex/Codex.exe"));
            candidates.push(PathBuf::from(program_files).join("ChatGPT/ChatGPT.exe"));
        }
        candidates.into_iter().find(|path| path.exists())
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        None
    }
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
        path.exists().then_some(path.to_path_buf())
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        let _ = path;
        None
    }
}

#[cfg(test)]
mod tests {
    use super::executable_from_install;
    use std::path::Path;

    #[test]
    fn missing_install_has_no_executable() {
        assert!(executable_from_install(Path::new("/definitely/missing/codex")).is_none());
    }
}
