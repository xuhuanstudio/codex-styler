mod cdp;
mod codex;
mod diagnostics;
mod error;
mod model;

use std::{
    collections::HashMap,
    fs,
    path::{Component, Path, PathBuf},
    sync::Mutex,
    time::Instant,
};

use model::{AppRuntime, RuntimeStatus};
use semver::Version;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::{
    AppHandle, Manager, State,
    ipc::Channel,
    ipc::{InvokeBody, Request, Response},
};
use tauri_plugin_updater::{Update, UpdaterExt};

const SUPPORTED_CODEX_VERSIONS: &[&str] = &["26.707.72221", "26.707.91948"];
const RELEASES_API: &str =
    "https://api.github.com/repos/xuhuanstudio/codex-styler/releases?per_page=20";

#[derive(Debug, Deserialize)]
struct GitHubRelease {
    tag_name: String,
    draft: bool,
    prerelease: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
struct LocalizedReleaseNotes {
    locale: String,
    summary: String,
    #[serde(default)]
    highlights: Vec<String>,
    #[serde(default)]
    fixes: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ReleaseNotesDocument {
    format: String,
    version: String,
    default_locale: String,
    locales: HashMap<String, ReleaseNotesLocale>,
}

#[derive(Clone, Debug, Deserialize)]
struct ReleaseNotesLocale {
    summary: String,
    #[serde(default)]
    highlights: Vec<String>,
    #[serde(default)]
    fixes: Vec<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct UpdateMetadata {
    version: String,
    notes: Option<String>,
    release_notes: Option<LocalizedReleaseNotes>,
    published_at: Option<String>,
    prerelease: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct UpdateCheckResult {
    current_version: String,
    update: Option<UpdateMetadata>,
}

#[derive(Clone, Serialize)]
#[serde(tag = "event", content = "data")]
enum UpdateDownloadEvent {
    #[serde(rename_all = "camelCase")]
    Started {
        content_length: Option<u64>,
    },
    #[serde(rename_all = "camelCase")]
    Progress {
        chunk_length: usize,
    },
    Finished,
}

struct PendingUpdate(Mutex<Option<Update>>);

fn release_version(tag: &str) -> Option<Version> {
    Version::parse(tag.trim().trim_start_matches(['v', 'V'])).ok()
}

fn prerelease_channel(version: &Version) -> Option<&str> {
    version
        .pre
        .as_str()
        .split('.')
        .next()
        .filter(|value| !value.is_empty())
}

fn release_allowed_for_channel(current: &Version, candidate: &Version) -> bool {
    match prerelease_channel(current) {
        None => candidate.pre.is_empty(),
        Some("alpha") => true,
        Some("beta") => {
            candidate.pre.is_empty() || matches!(prerelease_channel(candidate), Some("beta" | "rc"))
        }
        Some("rc") => {
            candidate.pre.is_empty() || matches!(prerelease_channel(candidate), Some("rc"))
        }
        Some(channel) => candidate.pre.is_empty() || prerelease_channel(candidate) == Some(channel),
    }
}

fn select_release(
    current: &Version,
    releases: impl IntoIterator<Item = GitHubRelease>,
) -> Option<GitHubRelease> {
    releases
        .into_iter()
        .filter(|release| !release.draft)
        .filter_map(|release| {
            let version = release_version(&release.tag_name)?;
            (version > *current && release_allowed_for_channel(current, &version))
                .then_some((version, release))
        })
        .max_by(|(left, _), (right, _)| left.cmp(right))
        .map(|(_, release)| release)
}

fn select_localized_release_notes(
    document: &ReleaseNotesDocument,
    expected_version: &Version,
    requested_locale: Option<&str>,
) -> Option<LocalizedReleaseNotes> {
    if document.format != "codex-styler-release-notes-v1"
        || Version::parse(&document.version).ok().as_ref() != Some(expected_version)
    {
        return None;
    }

    let requested = requested_locale.unwrap_or_default();
    let language = requested.split(['-', '_']).next().unwrap_or_default();
    let candidates = [requested, language, document.default_locale.as_str(), "en"];
    candidates.into_iter().find_map(|locale| {
        if locale.is_empty() {
            return None;
        }
        document
            .locales
            .get(locale)
            .cloned()
            .map(|notes| LocalizedReleaseNotes {
                locale: locale.to_string(),
                summary: notes.summary,
                highlights: notes.highlights,
                fixes: notes.fixes,
            })
    })
}

async fn fetch_localized_release_notes(
    client: &reqwest::Client,
    tag: &str,
    expected_version: &Version,
    locale: Option<&str>,
) -> Option<LocalizedReleaseNotes> {
    let endpoint = format!(
        "https://github.com/xuhuanstudio/codex-styler/releases/download/{tag}/release-notes.json"
    );
    let document = client
        .get(endpoint)
        .header("Accept", "application/json")
        .header("User-Agent", "codex-styler-update-check")
        .send()
        .await
        .ok()?
        .error_for_status()
        .ok()?
        .json::<ReleaseNotesDocument>()
        .await
        .ok()?;
    select_localized_release_notes(&document, expected_version, locale)
}

#[tauri::command]
async fn check_for_updates(
    app: AppHandle,
    pending_update: State<'_, PendingUpdate>,
    locale: Option<String>,
) -> Result<UpdateCheckResult, String> {
    let current = Version::parse(env!("CARGO_PKG_VERSION")).map_err(|error| error.to_string())?;
    *pending_update
        .0
        .lock()
        .map_err(|_| "Update state is unavailable".to_string())? = None;
    let client = reqwest::Client::new();
    let releases = client
        .get(RELEASES_API)
        .header("Accept", "application/vnd.github+json")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .header("User-Agent", "codex-styler-update-check")
        .send()
        .await
        .map_err(|error| format!("Could not reach GitHub Releases: {error}"))?
        .error_for_status()
        .map_err(|error| format!("GitHub Releases returned an error: {error}"))?
        .json::<Vec<GitHubRelease>>()
        .await
        .map_err(|error| format!("Could not read the GitHub release list: {error}"))?;
    let Some(release) = select_release(&current, releases) else {
        return Ok(UpdateCheckResult {
            current_version: current.to_string(),
            update: None,
        });
    };
    let endpoint = format!(
        "https://github.com/xuhuanstudio/codex-styler/releases/download/{}/latest.json",
        release.tag_name
    )
    .parse()
    .map_err(|error| format!("Invalid update endpoint: {error}"))?;
    let update = app
        .updater_builder()
        .endpoints(vec![endpoint])
        .map_err(|error| error.to_string())?
        .build()
        .map_err(|error| error.to_string())?
        .check()
        .await
        .map_err(|error| format!("Could not verify the update manifest: {error}"))?;
    let Some(update) = update else {
        return Ok(UpdateCheckResult {
            current_version: current.to_string(),
            update: None,
        });
    };
    let expected_version = release_version(&release.tag_name)
        .ok_or_else(|| "The selected GitHub release has an invalid version".to_string())?;
    let manifest_version = Version::parse(&update.version)
        .map_err(|error| format!("The update manifest has an invalid version: {error}"))?;
    if manifest_version != expected_version {
        return Err("The update manifest version does not match its GitHub release".into());
    }
    let release_notes = fetch_localized_release_notes(
        &client,
        &release.tag_name,
        &expected_version,
        locale.as_deref(),
    )
    .await;
    let metadata = UpdateMetadata {
        version: update.version.clone(),
        notes: update.body.clone(),
        release_notes,
        published_at: update.date.map(|date| date.to_string()),
        prerelease: release.prerelease,
    };
    *pending_update
        .0
        .lock()
        .map_err(|_| "Update state is unavailable".to_string())? = Some(update);
    Ok(UpdateCheckResult {
        current_version: current.to_string(),
        update: Some(metadata),
    })
}

#[tauri::command]
async fn download_and_install_update(
    pending_update: State<'_, PendingUpdate>,
    on_event: Channel<UpdateDownloadEvent>,
) -> Result<(), String> {
    let update = pending_update
        .0
        .lock()
        .map_err(|_| "Update state is unavailable".to_string())?
        .take()
        .ok_or_else(|| "There is no verified update ready to install".to_string())?;
    let mut started = false;
    update
        .download_and_install(
            |chunk_length, content_length| {
                if !started {
                    let _ = on_event.send(UpdateDownloadEvent::Started { content_length });
                    started = true;
                }
                let _ = on_event.send(UpdateDownloadEvent::Progress { chunk_length });
            },
            || {
                let _ = on_event.send(UpdateDownloadEvent::Finished);
            },
        )
        .await
        .map_err(|error| format!("Could not download and install the update: {error}"))
}

#[tauri::command]
fn restart_app(app: AppHandle) {
    app.restart();
}

fn compatibility_for_version(version: Option<&str>) -> model::Compatibility {
    match version {
        Some(version) if SUPPORTED_CODEX_VERSIONS.contains(&version) => {
            model::Compatibility::Supported
        }
        _ => model::Compatibility::Safe,
    }
}

fn is_valid_compatibility_mode(mode: &str) -> bool {
    matches!(mode, "auto" | "compatibility" | "developer")
}

fn is_valid_theme_id(theme_id: &str) -> bool {
    let mut chars = theme_id.chars();
    let Some(first) = chars.next() else {
        return false;
    };
    theme_id.len() <= 64
        && theme_id.len() >= 3
        && first.is_ascii_lowercase()
        && chars.all(|character| {
            character.is_ascii_lowercase()
                || character.is_ascii_digit()
                || matches!(character, '.' | '-')
        })
}

fn theme_archive_path(app: &AppHandle, theme_id: &str) -> Result<PathBuf, String> {
    if !is_valid_theme_id(theme_id) {
        return Err("Theme id is not safe for local storage".into());
    }
    let directory = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?
        .join("themes");
    fs::create_dir_all(&directory).map_err(|error| error.to_string())?;
    Ok(directory.join(format!("{theme_id}.codex-styler-theme")))
}

fn companion_archive_path(app: &AppHandle, companion_id: &str) -> Result<PathBuf, String> {
    if !is_valid_theme_id(companion_id) {
        return Err("Companion id is not safe for local storage".into());
    }
    let directory = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?
        .join("companions");
    fs::create_dir_all(&directory).map_err(|error| error.to_string())?;
    Ok(directory.join(format!("{companion_id}.codex-styler-companion")))
}

#[tauri::command]
fn save_theme_archive(app: AppHandle, request: Request<'_>) -> Result<(), String> {
    let theme_id = request
        .headers()
        .get("x-codex-styler-theme-id")
        .and_then(|value| value.to_str().ok())
        .ok_or_else(|| "Theme archive request is missing a valid theme id".to_string())?;
    let archive = match request.body() {
        InvokeBody::Raw(bytes) => bytes,
        InvokeBody::Json(_) => return Err("Theme archive request must contain raw bytes".into()),
    };
    let path = theme_archive_path(&app, theme_id)?;
    fs::write(path, archive).map_err(|error| error.to_string())
}

#[tauri::command]
fn load_theme_archive(app: AppHandle, theme_id: String) -> Result<Response, String> {
    let path = theme_archive_path(&app, &theme_id)?;
    if !path.exists() {
        return Ok(Response::new(Vec::<u8>::new()));
    }
    fs::read(path)
        .map(Response::new)
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn delete_theme_archive(app: AppHandle, theme_id: String) -> Result<(), String> {
    let path = theme_archive_path(&app, &theme_id)?;
    if path.exists() {
        fs::remove_file(path).map_err(|error| error.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn save_companion_archive(app: AppHandle, request: Request<'_>) -> Result<(), String> {
    let companion_id = request
        .headers()
        .get("x-codex-styler-companion-id")
        .and_then(|value| value.to_str().ok())
        .ok_or_else(|| "Companion archive request is missing a valid companion id".to_string())?;
    let archive = match request.body() {
        InvokeBody::Raw(bytes) => bytes,
        InvokeBody::Json(_) => {
            return Err("Companion archive request must contain raw bytes".into());
        }
    };
    let path = companion_archive_path(&app, companion_id)?;
    fs::write(path, archive).map_err(|error| error.to_string())
}

#[tauri::command]
fn load_companion_archive(app: AppHandle, companion_id: String) -> Result<Response, String> {
    let path = companion_archive_path(&app, &companion_id)?;
    if !path.exists() {
        return Ok(Response::new(Vec::<u8>::new()));
    }
    fs::read(path)
        .map(Response::new)
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn delete_companion_archive(app: AppHandle, companion_id: String) -> Result<(), String> {
    let path = companion_archive_path(&app, &companion_id)?;
    if path.exists() {
        fs::remove_file(path).map_err(|error| error.to_string())?;
    }
    Ok(())
}

fn companion_project_directory(app: &AppHandle, project_id: &str) -> Result<PathBuf, String> {
    if !is_valid_theme_id(project_id) {
        return Err("Companion project id is not safe for local storage".into());
    }
    let directory = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?
        .join("companion-projects")
        .join(project_id);
    fs::create_dir_all(&directory).map_err(|error| error.to_string())?;
    Ok(directory)
}

fn is_safe_project_path(path: &str) -> bool {
    if path.is_empty() || path.len() > 160 || path.contains('\\') {
        return false;
    }
    let candidate = Path::new(path);
    if candidate.is_absolute()
        || candidate
            .components()
            .any(|component| !matches!(component, Component::Normal(_)))
    {
        return false;
    }
    if path == "project.json" {
        return true;
    }
    let safe_file = |prefix: &str, allowed_extensions: &[&str]| {
        path.strip_prefix(prefix).is_some_and(|name| {
            !name.is_empty()
                && !name.contains('/')
                && Path::new(name)
                    .extension()
                    .and_then(|extension| extension.to_str())
                    .is_some_and(|extension| {
                        allowed_extensions.contains(&extension.to_ascii_lowercase().as_str())
                    })
        })
    };
    safe_file(
        "sources/",
        &["png", "jpg", "jpeg", "webp", "mp4", "m4v", "mov", "webm"],
    ) || safe_file("frames/", &["png", "webp"])
}

const CREATOR_SOURCE_BYTE_LIMIT: u64 = 250 * 1024 * 1024;

fn is_supported_creator_source_path(path: &Path) -> bool {
    path.extension()
        .and_then(|extension| extension.to_str())
        .is_some_and(|extension| {
            matches!(
                extension.to_ascii_lowercase().as_str(),
                "png" | "jpg" | "jpeg" | "webp" | "mp4" | "m4v" | "mov" | "webm"
            )
        })
}

#[tauri::command]
fn read_creator_source_file(path: String) -> Result<Response, String> {
    let path = PathBuf::from(path);
    if !path.is_absolute() || !is_supported_creator_source_path(&path) {
        return Err(
            "Dropped source must be an absolute PNG, JPEG, WebP, MP4, M4V, MOV, or WebM path"
                .into(),
        );
    }
    let metadata = fs::metadata(&path).map_err(|error| error.to_string())?;
    if !metadata.is_file() {
        return Err("Dropped source is not a regular file".into());
    }
    if metadata.len() > CREATOR_SOURCE_BYTE_LIMIT {
        return Err("Dropped source exceeds the 250 MiB creator limit".into());
    }
    fs::read(path)
        .map(Response::new)
        .map_err(|error| error.to_string())
}

fn companion_project_file_path(
    app: &AppHandle,
    project_id: &str,
    project_path: &str,
) -> Result<PathBuf, String> {
    if !is_safe_project_path(project_path) {
        return Err("Companion project path is not safe for local storage".into());
    }
    let path = companion_project_directory(app, project_id)?.join(project_path);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    Ok(path)
}

#[tauri::command]
fn save_companion_project_file(app: AppHandle, request: Request<'_>) -> Result<(), String> {
    let project_id = request
        .headers()
        .get("x-codex-styler-project-id")
        .and_then(|value| value.to_str().ok())
        .ok_or_else(|| "Project file request is missing a valid project id".to_string())?;
    let project_path = request
        .headers()
        .get("x-codex-styler-project-path")
        .and_then(|value| value.to_str().ok())
        .ok_or_else(|| "Project file request is missing a valid relative path".to_string())?;
    let contents = match request.body() {
        InvokeBody::Raw(bytes) => bytes,
        InvokeBody::Json(_) => return Err("Project file request must contain raw bytes".into()),
    };
    let path = companion_project_file_path(&app, project_id, project_path)?;
    fs::write(path, contents).map_err(|error| error.to_string())
}

#[tauri::command]
fn load_companion_project_file(
    app: AppHandle,
    project_id: String,
    project_path: String,
) -> Result<Response, String> {
    let path = companion_project_file_path(&app, &project_id, &project_path)?;
    if !path.exists() {
        return Ok(Response::new(Vec::<u8>::new()));
    }
    fs::read(path)
        .map(Response::new)
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn list_companion_projects(app: AppHandle) -> Result<Vec<String>, String> {
    let root = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?
        .join("companion-projects");
    if !root.exists() {
        return Ok(Vec::new());
    }
    let mut projects = Vec::new();
    for entry in fs::read_dir(root).map_err(|error| error.to_string())? {
        let entry = entry.map_err(|error| error.to_string())?;
        let file_type = entry.file_type().map_err(|error| error.to_string())?;
        if !file_type.is_dir() {
            continue;
        }
        let id = entry.file_name().to_string_lossy().into_owned();
        if is_valid_theme_id(&id) && entry.path().join("project.json").exists() {
            projects.push(id);
        }
    }
    projects.sort();
    Ok(projects)
}

#[tauri::command]
fn delete_companion_project(app: AppHandle, project_id: String) -> Result<(), String> {
    let directory = companion_project_directory(&app, &project_id)?;
    if directory.exists() {
        fs::remove_dir_all(directory).map_err(|error| error.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn detect_codex(custom_path: Option<String>) -> Result<model::CodexDetection, String> {
    codex::detect_codex(custom_path.as_deref().map(std::path::Path::new))
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn validate_codex_path(path: String) -> bool {
    codex::validate_install_path(std::path::Path::new(&path))
}

#[tauri::command]
async fn quit_codex(
    state: State<'_, Mutex<AppRuntime>>,
    custom_path: Option<String>,
) -> Result<model::CodexDetection, String> {
    let detection = codex::quit_codex(custom_path.as_deref().map(std::path::Path::new))
        .await
        .map_err(|error| error.to_string())?;
    let mut runtime = state
        .lock()
        .map_err(|_| "Runtime state is unavailable".to_string())?;
    *runtime = AppRuntime::default();
    Ok(detection)
}

#[tauri::command]
fn runtime_status(state: State<'_, Mutex<AppRuntime>>) -> RuntimeStatus {
    state
        .lock()
        .map(|runtime| runtime.status())
        .unwrap_or_else(|_| RuntimeStatus::error("Runtime state is unavailable"))
}

#[tauri::command]
async fn launch_codex(
    state: State<'_, Mutex<AppRuntime>>,
    custom_path: Option<String>,
) -> Result<RuntimeStatus, String> {
    let started_at = Instant::now();
    if let Ok(runtime) = state.lock()
        && runtime.connected
    {
        return Ok(runtime.status());
    }

    let detection = codex::detect_codex(custom_path.as_deref().map(std::path::Path::new))
        .map_err(|error| error.to_string())?;
    if !detection.installed {
        return Err("Codex Desktop was not found on this device".into());
    }
    if detection.running {
        return Err(
            "Codex is already running. Close it first so Styler can relaunch it with a temporary loopback debugging port."
                .into(),
        );
    }

    {
        let mut runtime = state
            .lock()
            .map_err(|_| "Runtime state is unavailable".to_string())?;
        runtime.state = model::RuntimeState::Launching;
        runtime.message = None;
    }

    let session = cdp::launch_and_connect(
        detection
            .path
            .as_deref()
            .ok_or_else(|| "Codex executable path is unavailable".to_string())?,
    )
    .await
    .map_err(|error| error.to_string())?;

    let mut runtime = state
        .lock()
        .map_err(|_| "Runtime state is unavailable".to_string())?;
    runtime.state = model::RuntimeState::Connected;
    runtime.connected = true;
    runtime.started_by_styler = true;
    runtime.port = Some(session.port);
    runtime.websocket_url = Some(session.websocket_url);
    runtime.child_id = Some(session.child_id);
    runtime.codex_version = detection.version;
    runtime.compatibility = compatibility_for_version(runtime.codex_version.as_deref());
    runtime.message = Some("Connected through a temporary loopback-only CDP session".into());
    runtime.record(
        "launch",
        "connected",
        started_at.elapsed().as_millis() as u64,
    );
    Ok(runtime.status())
}

#[tauri::command]
async fn apply_theme(
    theme: Value,
    variant: String,
    compatibility_mode: String,
    revision: u64,
    state: State<'_, Mutex<AppRuntime>>,
) -> Result<RuntimeStatus, String> {
    let started_at = Instant::now();
    if variant != "light" && variant != "dark" {
        return Err("Theme variant must be light or dark".into());
    }
    if !is_valid_compatibility_mode(&compatibility_mode) {
        return Err("The requested runtime strategy is invalid".into());
    }
    let websocket_url = {
        let mut runtime = state
            .lock()
            .map_err(|_| "Runtime state is unavailable".to_string())?;
        if revision < runtime.revision {
            return Ok(runtime.status());
        }
        runtime.revision = revision;
        runtime.state = model::RuntimeState::Applying;
        runtime
            .websocket_url
            .clone()
            .ok_or_else(|| "Codex is not connected".to_string())?
    };

    let theme_json = serde_json::to_string(&theme).map_err(|error| error.to_string())?;
    let variant_json = serde_json::to_string(&variant).map_err(|error| error.to_string())?;
    let mode_json =
        serde_json::to_string(&compatibility_mode).map_err(|error| error.to_string())?;
    let expression = format!(
        "{}\nwindow.__CODEX_STYLER_RUNTIME__.apply({}, {}, {}, {});",
        include_str!("runtime.js"),
        theme_json,
        variant_json,
        mode_json,
        revision,
    );

    let response = cdp::evaluate(&websocket_url, &expression)
        .await
        .map_err(|error| error.to_string())?;

    let outcome = response.pointer("/result/result/value");
    let resolved_mode = outcome
        .and_then(|value| value.get("resolvedMode"))
        .and_then(Value::as_str)
        .unwrap_or("compatibility");
    let fallback_reason = outcome
        .and_then(|value| value.get("reason"))
        .and_then(Value::as_str);

    let mut runtime = state
        .lock()
        .map_err(|_| "Runtime state is unavailable".to_string())?;
    if revision != runtime.revision {
        return Ok(runtime.status());
    }
    runtime.state = if matches!(resolved_mode, "semantic" | "developer") {
        model::RuntimeState::Applied
    } else {
        model::RuntimeState::Fallback
    };
    runtime.compatibility = if matches!(resolved_mode, "semantic" | "developer") {
        model::Compatibility::Supported
    } else {
        model::Compatibility::Safe
    };
    runtime.message = Some(match resolved_mode {
        "semantic" => "Theme applied after live Codex interface verification".into(),
        "developer" => "Theme applied in developer mode without compatibility enforcement".into(),
        _ => fallback_reason.map_or_else(
            || "Theme applied in isolated Conservative mode".into(),
            |reason| format!("Enhanced verification fell back to Conservative mode: {reason}"),
        ),
    });
    runtime.record(
        "apply-configuration",
        resolved_mode,
        started_at.elapsed().as_millis() as u64,
    );
    Ok(runtime.status())
}

#[tauri::command]
async fn update_companion(
    entity: Option<Value>,
    revision: u64,
    state: State<'_, Mutex<AppRuntime>>,
) -> Result<RuntimeStatus, String> {
    let started_at = Instant::now();
    let websocket_url = {
        let mut runtime = state
            .lock()
            .map_err(|_| "Runtime state is unavailable".to_string())?;
        if revision < runtime.revision {
            return Ok(runtime.status());
        }
        runtime.revision = revision;
        runtime.state = model::RuntimeState::Applying;
        runtime
            .websocket_url
            .clone()
            .ok_or_else(|| "Codex is not connected".to_string())?
    };
    let entity_json = serde_json::to_string(&entity).map_err(|error| error.to_string())?;
    let expression = format!(
        "window.__CODEX_STYLER_RUNTIME__?.updateEntity({}, {});",
        entity_json, revision,
    );
    cdp::evaluate(&websocket_url, &expression)
        .await
        .map_err(|error| error.to_string())?;
    let mut runtime = state
        .lock()
        .map_err(|_| "Runtime state is unavailable".to_string())?;
    if revision != runtime.revision {
        return Ok(runtime.status());
    }
    runtime.state = if runtime.compatibility == model::Compatibility::Supported {
        model::RuntimeState::Applied
    } else {
        model::RuntimeState::Fallback
    };
    runtime.message = Some("Companion configuration updated without reinjecting the theme".into());
    runtime.record(
        "update-companion",
        "applied",
        started_at.elapsed().as_millis() as u64,
    );
    Ok(runtime.status())
}

#[tauri::command]
async fn pause_theme(state: State<'_, Mutex<AppRuntime>>) -> Result<RuntimeStatus, String> {
    let websocket_url = state
        .lock()
        .map_err(|_| "Runtime state is unavailable".to_string())?
        .websocket_url
        .clone()
        .ok_or_else(|| "Codex is not connected".to_string())?;

    cdp::evaluate(&websocket_url, "window.__CODEX_STYLER_RUNTIME__?.pause();")
        .await
        .map_err(|error| error.to_string())?;

    let mut runtime = state
        .lock()
        .map_err(|_| "Runtime state is unavailable".to_string())?;
    runtime.state = model::RuntimeState::Paused;
    runtime.message = Some("Theme paused; the Codex connection remains available".into());
    Ok(runtime.status())
}

#[tauri::command]
async fn restore_official(state: State<'_, Mutex<AppRuntime>>) -> Result<RuntimeStatus, String> {
    let websocket_url = state
        .lock()
        .map_err(|_| "Runtime state is unavailable".to_string())?
        .websocket_url
        .clone();

    if let Some(url) = websocket_url {
        let _ = cdp::evaluate(&url, "window.__CODEX_STYLER_RUNTIME__?.restore();").await;
    }

    let mut runtime = state
        .lock()
        .map_err(|_| "Runtime state is unavailable".to_string())?;
    runtime.state = if runtime.connected {
        model::RuntimeState::Connected
    } else {
        model::RuntimeState::Disconnected
    };
    runtime.message = Some("All Codex Styler runtime nodes were removed".into());
    Ok(runtime.status())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(Mutex::new(AppRuntime::default()))
        .manage(PendingUpdate(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            detect_codex,
            validate_codex_path,
            quit_codex,
            runtime_status,
            launch_codex,
            apply_theme,
            update_companion,
            pause_theme,
            restore_official,
            save_theme_archive,
            load_theme_archive,
            delete_theme_archive,
            save_companion_archive,
            load_companion_archive,
            delete_companion_archive,
            save_companion_project_file,
            load_companion_project_file,
            list_companion_projects,
            delete_companion_project,
            read_creator_source_file,
            check_for_updates,
            download_and_install_update,
            restart_app,
            diagnostics::run_diagnostics
        ])
        .run(tauri::generate_context!())
        .expect("error while running Codex Styler");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn known_codex_version_uses_the_semantic_adapter() {
        assert_eq!(
            compatibility_for_version(Some("26.707.72221")),
            model::Compatibility::Supported
        );
        assert_eq!(
            compatibility_for_version(Some("26.707.91948")),
            model::Compatibility::Supported
        );
    }

    #[test]
    fn unknown_codex_version_remains_unverified_until_runtime_check() {
        assert_eq!(
            compatibility_for_version(Some("99.0.0")),
            model::Compatibility::Safe
        );
        assert_eq!(compatibility_for_version(None), model::Compatibility::Safe);
    }

    #[test]
    fn compatibility_mode_is_an_explicit_allowlist() {
        assert!(is_valid_compatibility_mode("auto"));
        assert!(is_valid_compatibility_mode("compatibility"));
        assert!(is_valid_compatibility_mode("developer"));
        assert!(!is_valid_compatibility_mode("force"));
    }

    #[test]
    fn theme_archive_ids_are_restricted_to_manifest_safe_characters() {
        assert!(is_valid_theme_id("local.quiet-garden-a1b2c"));
        assert!(is_valid_theme_id("codex-styler.native-refined"));
        assert!(!is_valid_theme_id("../quiet-garden"));
        assert!(!is_valid_theme_id("Local.Theme"));
        assert!(!is_valid_theme_id("ab"));
    }

    #[test]
    fn creator_drop_paths_only_accept_declared_media_extensions() {
        assert!(is_supported_creator_source_path(Path::new("/tmp/turn.MP4")));
        assert!(is_supported_creator_source_path(Path::new(
            "C:\\media\\frame.webp"
        )));
        assert!(!is_supported_creator_source_path(Path::new(
            "/tmp/project.json"
        )));
        assert!(!is_supported_creator_source_path(Path::new(
            "/tmp/script.svg"
        )));
    }

    #[test]
    fn companion_project_paths_allow_only_declared_source_and_frame_files() {
        assert!(is_safe_project_path("project.json"));
        assert!(is_safe_project_path("sources/source-001.mp4"));
        assert!(is_safe_project_path("frames/source-001.webp"));
        assert!(is_safe_project_path("frames/source-512.png"));
        assert!(!is_safe_project_path("frames/source-001.svg"));
        assert!(!is_safe_project_path("frames/nested/source-001.webp"));
        assert!(!is_safe_project_path("../frames/source-001.webp"));
    }

    #[test]
    fn alpha_builds_select_the_newest_non_draft_prerelease() {
        let current = Version::parse("0.1.0-alpha.9").unwrap();
        let selected = select_release(
            &current,
            [
                GitHubRelease {
                    tag_name: "v0.1.0-alpha.10".into(),
                    draft: false,
                    prerelease: true,
                },
                GitHubRelease {
                    tag_name: "v0.1.0-alpha.11".into(),
                    draft: true,
                    prerelease: true,
                },
                GitHubRelease {
                    tag_name: "v0.1.0-alpha.4".into(),
                    draft: false,
                    prerelease: true,
                },
            ],
        )
        .unwrap();
        assert_eq!(selected.tag_name, "v0.1.0-alpha.10");
    }

    #[test]
    fn stable_builds_do_not_install_prerelease_updates() {
        let current = Version::parse("1.0.0").unwrap();
        let selected = select_release(
            &current,
            [
                GitHubRelease {
                    tag_name: "v1.1.0-alpha.1".into(),
                    draft: false,
                    prerelease: true,
                },
                GitHubRelease {
                    tag_name: "v1.0.1".into(),
                    draft: false,
                    prerelease: false,
                },
            ],
        )
        .unwrap();
        assert_eq!(selected.tag_name, "v1.0.1");
    }

    #[test]
    fn beta_builds_skip_alpha_but_accept_beta_rc_and_stable() {
        let current = Version::parse("0.2.0-beta.1").unwrap();
        let selected = select_release(
            &current,
            [
                GitHubRelease {
                    tag_name: "v0.3.0-alpha.4".into(),
                    draft: false,
                    prerelease: true,
                },
                GitHubRelease {
                    tag_name: "v0.2.0-beta.2".into(),
                    draft: false,
                    prerelease: true,
                },
                GitHubRelease {
                    tag_name: "v0.2.0-rc.1".into(),
                    draft: false,
                    prerelease: true,
                },
            ],
        )
        .unwrap();
        assert_eq!(selected.tag_name, "v0.2.0-rc.1");
    }

    #[test]
    fn rc_builds_do_not_move_back_to_beta_or_alpha() {
        let current = Version::parse("0.2.0-rc.1").unwrap();
        let selected = select_release(
            &current,
            [
                GitHubRelease {
                    tag_name: "v0.3.0-beta.1".into(),
                    draft: false,
                    prerelease: true,
                },
                GitHubRelease {
                    tag_name: "v0.2.0-rc.2".into(),
                    draft: false,
                    prerelease: true,
                },
            ],
        )
        .unwrap();
        assert_eq!(selected.tag_name, "v0.2.0-rc.2");
    }

    #[test]
    fn localized_release_notes_prefer_the_requested_locale() {
        let document = ReleaseNotesDocument {
            format: "codex-styler-release-notes-v1".into(),
            version: "0.2.0-beta.2".into(),
            default_locale: "en".into(),
            locales: HashMap::from([
                (
                    "en".into(),
                    ReleaseNotesLocale {
                        summary: "Creator refinements".into(),
                        highlights: vec!["English highlight".into()],
                        fixes: vec![],
                    },
                ),
                (
                    "zh-CN".into(),
                    ReleaseNotesLocale {
                        summary: "创作器体验优化".into(),
                        highlights: vec!["中文重点".into()],
                        fixes: vec![],
                    },
                ),
            ]),
        };

        let notes = select_localized_release_notes(
            &document,
            &Version::parse("0.2.0-beta.2").unwrap(),
            Some("zh-CN"),
        )
        .unwrap();
        assert_eq!(notes.locale, "zh-CN");
        assert_eq!(notes.summary, "创作器体验优化");
    }

    #[test]
    fn localized_release_notes_fall_back_to_english_and_reject_other_versions() {
        let document = ReleaseNotesDocument {
            format: "codex-styler-release-notes-v1".into(),
            version: "0.2.0-beta.2".into(),
            default_locale: "en".into(),
            locales: HashMap::from([(
                "en".into(),
                ReleaseNotesLocale {
                    summary: "Creator refinements".into(),
                    highlights: vec![],
                    fixes: vec![],
                },
            )]),
        };

        let notes = select_localized_release_notes(
            &document,
            &Version::parse("0.2.0-beta.2").unwrap(),
            Some("fr-FR"),
        )
        .unwrap();
        assert_eq!(notes.locale, "en");
        assert!(
            select_localized_release_notes(
                &document,
                &Version::parse("0.2.0-rc.1").unwrap(),
                Some("en"),
            )
            .is_none()
        );
    }
}
