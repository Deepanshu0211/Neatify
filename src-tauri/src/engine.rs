use serde::{Deserialize, Serialize};
use std::{
    collections::{BTreeMap, HashMap, HashSet},
    fs::{self, OpenOptions},
    io::Write,
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicBool, Ordering},
        Mutex,
    },
    time::{Instant, SystemTime, UNIX_EPOCH},
};
use tauri::{Emitter, Manager};

#[derive(Default)]
pub struct Engine {
    pub busy: AtomicBool,
    pub cancel: AtomicBool,
    pub stats_lock: Mutex<()>,
}
struct BusyGuard<'a>(&'a AtomicBool);
impl Drop for BusyGuard<'_> {
    fn drop(&mut self) {
        self.0.store(false, Ordering::SeqCst);
    }
}
#[derive(Default, Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct Stats {
    sessions: u64,
    organized: u64,
    failed: u64,
    duration_ms: u64,
    undo_count: u64,
    file_types: BTreeMap<String, u64>,
    categories: BTreeMap<String, u64>,
    events: Vec<Session>,
}
#[derive(Serialize, Deserialize, Clone)]
pub struct Failure {
    pub path: String,
    pub reason: String,
}
#[derive(Serialize, Deserialize, Clone)]
pub struct Session {
    pub id: String,
    pub path: String,
    pub timestamp: String,
    pub kind: String,
    pub organized: u64,
    pub failed: u64,
    pub cancelled: bool,
    pub errors: Vec<Failure>,
    pub categories: BTreeMap<String, u64>,
    #[serde(default)]
    pub undone: bool,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Move {
    pub source: PathBuf,
    pub destination: PathBuf,
    pub category: String,
    pub extension: String,
    #[serde(default)]
    pub bytes: u64,
    #[serde(default)]
    pub modified: u64,
    #[serde(default)]
    pub session_id: String,
    #[serde(default)]
    pub created_dirs: Vec<PathBuf>,
}
#[derive(Default, Serialize, Deserialize, Clone)]
#[serde(default, rename_all = "camelCase")]
pub struct Rules {
    pub extensions: BTreeMap<String, String>,
    pub excluded_folders: Vec<String>,
    pub excluded_extensions: Vec<String>,
    pub skip_duplicates: bool,
    pub private_history: bool,
}
#[derive(Serialize)]
pub struct Outcome {
    pub organized: u64,
    pub failed: u64,
    pub cancelled: bool,
    pub errors: Vec<Failure>,
}
fn data_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}
fn read_stats(app: &tauri::AppHandle) -> Result<Stats, String> {
    let p = data_dir(app)?.join("activity.json");
    if !p.exists() {
        return Ok(Stats::default());
    }
    serde_json::from_slice(&fs::read(p).map_err(|e| e.to_string())?).map_err(|e| e.to_string())
}
fn save_stats(app: &tauri::AppHandle, stats: &Stats) -> Result<(), String> {
    let dir = data_dir(app)?;
    let tmp = dir.join("activity.tmp");
    fs::write(&tmp, serde_json::to_vec(stats).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;
    fs::rename(tmp, dir.join("activity.json")).map_err(|e| e.to_string())
}
fn valid_category(value: &str) -> bool {
    !value.is_empty()
        && !value.contains(['\\', ':'])
        && value.split('/').all(|p| {
            !p.is_empty()
                && p != "."
                && p != ".."
                && !p.ends_with(['.', ' '])
                && !p.contains(['<', '>', '"', '|', '?', '*'])
        })
}
fn modified(meta: &fs::Metadata) -> u64 {
    meta.modified()
        .unwrap_or(SystemTime::UNIX_EPOCH)
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}
fn plan(
    path: &str,
    method: &str,
    rules: &Rules,
    sources: Option<&[String]>,
) -> Result<Vec<Move>, String> {
    if !["category", "extension"].contains(&method) {
        return Err("Unknown sorting style".into());
    }
    if rules.extensions.values().any(|v| !valid_category(v)) {
        return Err(
            "Category names must be relative folder names, without .. or reserved characters."
                .into(),
        );
    }
    let dir = fs::canonicalize(path).map_err(|e| format!("Cannot read {}: {}", path, e))?;
    for excluded in &rules.excluded_folders {
        if let Ok(p) = fs::canonicalize(excluded) {
            if dir.starts_with(p) {
                return Ok(Vec::new());
            }
        }
    }
    let only: Option<HashSet<PathBuf>> = sources.map(|items| {
        items
            .iter()
            .filter_map(|s| fs::canonicalize(s).ok())
            .collect()
    });
    let mut moves = Vec::new();
    let mut reserved = HashSet::new();
    let mut verified = HashSet::new();
    let mut entries = fs::read_dir(&dir)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    entries.sort_by_key(|e| e.file_name());
    for entry in entries {
        if !entry.file_type().map_err(|e| e.to_string())?.is_file()
            || entry.file_name().to_string_lossy().starts_with('.')
        {
            continue;
        }
        let source = entry.path();
        if only.as_ref().is_some_and(|s| !s.contains(&source)) {
            continue;
        }
        let extension = source
            .extension()
            .unwrap_or_default()
            .to_string_lossy()
            .to_lowercase();
        if rules
            .excluded_extensions
            .iter()
            .any(|e| e.trim_start_matches('.').eq_ignore_ascii_case(&extension))
        {
            continue;
        }
        let category = if let Some(custom) = rules.extensions.get(&extension) {
            custom.clone()
        } else if method == "extension" {
            if extension.is_empty() {
                "No extension".into()
            } else {
                format!("{} Files", extension.to_uppercase())
            }
        } else {
            crate::categories::category(&extension)
        };
        let target = dir.join(&category);
        if verified.insert(target.clone()) {
            let mut ancestor = target.as_path();
            while !ancestor.exists() {
                ancestor = ancestor.parent().ok_or("Invalid destination")?;
            }
            if !fs::canonicalize(ancestor)
                .map_err(|e| e.to_string())?
                .starts_with(&dir)
            {
                return Err(format!(
                    "Destination {} points outside this folder",
                    target.display()
                ));
            }
        }
        let mut destination = target.join(entry.file_name());
        if rules.skip_duplicates && destination.exists() {
            continue;
        }
        let mut suffix = 1;
        while destination.exists() || reserved.contains(&destination) {
            let stem = source.file_stem().unwrap_or_default().to_string_lossy();
            let ext = if extension.is_empty() {
                String::new()
            } else {
                format!(".{}", extension)
            };
            destination = target.join(format!("{} ({}){}", stem, suffix, ext));
            suffix += 1;
        }
        reserved.insert(destination.clone());
        let meta = entry.metadata().map_err(|e| e.to_string())?;
        moves.push(Move {
            source,
            destination,
            category,
            extension,
            bytes: meta.len(),
            modified: modified(&meta),
            session_id: String::new(),
            created_dirs: Vec::new(),
        });
    }
    Ok(moves)
}
fn verify_expected(actual: Vec<Move>, expected: Option<Vec<Move>>) -> Result<Vec<Move>, String> {
    if let Some(expected) = expected {
        let lookup: HashMap<_, _> = actual.into_iter().map(|m| (m.source.clone(), m)).collect();
        let mut result = Vec::with_capacity(expected.len());
        let mut seen = HashSet::new();
        for old in expected {
            let current = lookup
                .get(&old.source)
                .ok_or("Files changed since the preview. Refresh the preview before organizing.")?;
            if !seen.insert(old.source.clone())
                || old.destination != current.destination
                || old.bytes != current.bytes
                || old.modified != current.modified
            {
                return Err(
                    "Files or destinations changed since the preview. Refresh before organizing."
                        .into(),
                );
            }
            result.push(current.clone());
        }
        Ok(result)
    } else {
        Ok(actual)
    }
}
#[tauri::command]
pub async fn get_organization_plan(
    path: String,
    method: String,
    rules: Option<Rules>,
    sources: Option<Vec<String>>,
) -> Result<Vec<Move>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        plan(
            &path,
            &method,
            &rules.unwrap_or_default(),
            sources.as_deref(),
        )
    })
    .await
    .map_err(|e| e.to_string())?
}
#[tauri::command]
pub async fn fetch_stats(app: tauri::AppHandle) -> Result<Stats, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<Engine>();
        let _lock = state.stats_lock.lock().map_err(|e| e.to_string())?;
        read_stats(&app)
    })
    .await
    .map_err(|e| e.to_string())?
}
#[tauri::command]
pub fn clear_activity(app: tauri::AppHandle, state: tauri::State<Engine>) -> Result<(), String> {
    if state.busy.load(Ordering::SeqCst) {
        return Err("Wait for the current operation to finish.".into());
    }
    let _lock = state.stats_lock.lock().map_err(|e| e.to_string())?;
    save_stats(&app, &Stats::default())
}
#[tauri::command]
pub fn cancel_organize(state: tauri::State<Engine>) {
    state.cancel.store(true, Ordering::SeqCst);
}
// Hard-link creation is atomic and never replaces an existing destination. The fallback
// uses create_new on filesystems without hard links; the source stays until copy succeeds.
fn move_without_overwrite(source: &Path, destination: &Path) -> Result<(), String> {
    match fs::hard_link(source, destination) {
        Ok(()) => {
            if let Err(e) = fs::remove_file(source) {
                let _ = fs::remove_file(destination);
                return Err(e.to_string());
            }
            Ok(())
        }
        Err(_) => {
            let mut input = fs::File::open(source).map_err(|e| e.to_string())?;
            let mut output = OpenOptions::new()
                .create_new(true)
                .write(true)
                .open(destination)
                .map_err(|e| e.to_string())?;
            let copied = std::io::copy(&mut input, &mut output).and_then(|_| output.sync_all());
            drop(output);
            if let Err(e) = copied {
                let _ = fs::remove_file(destination);
                return Err(e.to_string());
            }
            if let Err(e) = fs::remove_file(source) {
                let _ = fs::remove_file(destination);
                return Err(e.to_string());
            }
            Ok(())
        }
    }
}
fn directories_to_create(parent: &Path, root: &Path) -> Result<Vec<PathBuf>, String> {
    if !parent.starts_with(root) {
        return Err("Destination points outside the selected folder.".into());
    }
    let mut missing = Vec::new();
    let mut current = parent;
    while current != root && !current.exists() {
        missing.push(current.to_path_buf());
        current = current.parent().ok_or("Invalid destination")?;
    }
    if !fs::canonicalize(current)
        .map_err(|e| e.to_string())?
        .starts_with(root)
    {
        return Err("Destination points outside the selected folder.".into());
    }
    missing.reverse();
    Ok(missing)
}
fn history(root: &Path) -> Result<Vec<Move>, String> {
    let mut items = Vec::new();
    let legacy = root.join(".neatify-history.json");
    if legacy.exists() {
        items = serde_json::from_slice(&fs::read(legacy).map_err(|e| e.to_string())?)
            .map_err(|e| format!("Cannot read previous undo history: {}", e))?;
    }
    let current = root.join(".neatify-moves.jsonl");
    if current.exists() {
        for line in fs::read_to_string(current)
            .map_err(|e| e.to_string())?
            .lines()
        {
            if let Ok(item) = serde_json::from_str(line) {
                items.push(item);
            }
        }
    }
    Ok(items)
}
#[tauri::command]
pub async fn organize_files(
    path: String,
    method: String,
    rules: Option<Rules>,
    sources: Option<Vec<String>>,
    expected: Option<Vec<Move>>,
    app: tauri::AppHandle,
) -> Result<Outcome, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<Engine>();
        if state.busy.swap(true, Ordering::SeqCst) {
            return Err("Another tidy is already running".into());
        }
        let _guard = BusyGuard(&state.busy);
        state.cancel.store(false, Ordering::SeqCst);
        let rules = rules.unwrap_or_default();
        let mut moves =
            verify_expected(plan(&path, &method, &rules, sources.as_deref())?, expected)?;
        if moves.is_empty() {
            return Err(
                "No eligible loose files to organize. Check exclusions or choose another folder."
                    .into(),
            );
        }
        let id = format!(
            "{}-{}",
            chrono::Utc::now().timestamp_millis(),
            rand::random::<u32>()
        );
        let start = Instant::now();
        let mut errors = Vec::new();
        let mut count = 0;
        let mut categories = BTreeMap::new();
        let mut types = BTreeMap::new();
        let root = fs::canonicalize(&path).map_err(|e| e.to_string())?;
        let mut journal = OpenOptions::new()
            .create(true)
            .append(true)
            .open(Path::new(&path).join(".neatify-moves.jsonl"))
            .map_err(|e| e.to_string())?;
        let total = moves.len();
        let mut last_emit = Instant::now();
        for (i, item) in moves.iter_mut().enumerate() {
            if state.cancel.load(Ordering::SeqCst) {
                break;
            }
            item.session_id = id.clone();
            let result = (|| -> Result<(), String> {
                let meta = fs::metadata(&item.source).map_err(|e| e.to_string())?;
                if meta.len() != item.bytes || modified(&meta) != item.modified {
                    return Err(
                        "File changed after scanning; left in its original location.".into(),
                    );
                }
                let parent = item.destination.parent().ok_or("Invalid destination")?;
                item.created_dirs = directories_to_create(parent, &root)?;
                fs::create_dir_all(parent).map_err(|e| e.to_string())?;
                let target = fs::canonicalize(item.destination.parent().unwrap())
                    .map_err(|e| e.to_string())?;
                if !target.starts_with(&root) {
                    return Err("Destination points outside the selected folder.".into());
                }
                if item.destination.exists() {
                    return Err("Destination already exists; original file was not moved.".into());
                }
                let record = serde_json::to_string(item).map_err(|e| e.to_string())?;
                writeln!(journal, "{}", record).map_err(|e| e.to_string())?;
                journal.flush().map_err(|e| e.to_string())?;
                move_without_overwrite(&item.source, &item.destination)
            })();
            match result {
                Ok(()) => {
                    count += 1;
                    *categories.entry(item.category.clone()).or_insert(0) += 1;
                    *types.entry(item.extension.to_uppercase()).or_insert(0) += 1;
                }
                Err(reason) => errors.push(Failure {
                    path: item.source.to_string_lossy().into_owned(),
                    reason,
                }),
            }
            if last_emit.elapsed().as_millis() >= 70 || i + 1 == total {
                let _ = app.emit("progress", ((i + 1) * 100 / total) as u32);
                last_emit = Instant::now();
            }
        }
        journal.sync_all().map_err(|e| e.to_string())?;
        let cancelled = state.cancel.load(Ordering::SeqCst);
        let _lock = state.stats_lock.lock().map_err(|e| e.to_string())?;
        let mut stats = read_stats(&app)?;
        stats.sessions += 1;
        stats.organized += count;
        stats.failed += errors.len() as u64;
        stats.duration_ms += start.elapsed().as_millis() as u64;
        for (name, n) in &categories {
            *stats.categories.entry(name.clone()).or_default() += n;
        }
        for (name, n) in types {
            *stats.file_types.entry(name).or_default() += n;
        }
        if !rules.private_history {
            stats.events.insert(
                0,
                Session {
                    id,
                    path,
                    timestamp: chrono::Utc::now().to_rfc3339(),
                    kind: "organize".into(),
                    organized: count,
                    failed: errors.len() as u64,
                    cancelled,
                    errors: errors.clone(),
                    categories,
                    undone: false,
                },
            );
            stats.events.truncate(200);
        }
        save_stats(&app, &stats)?;
        Ok(Outcome {
            organized: count,
            failed: errors.len() as u64,
            cancelled,
            errors,
        })
    })
    .await
    .map_err(|e| e.to_string())?
}
fn restore(root: &Path, session: Option<&str>) -> Result<Outcome, String> {
    let records = history(root)?;
    if records.is_empty() {
        return Err("No recorded moves to undo in this folder.".into());
    }
    let mut remaining = Vec::new();
    let mut created_dirs = Vec::new();
    let mut restored = 0;
    let mut errors = Vec::new();
    for item in records.into_iter().rev() {
        if session.is_some_and(|id| item.session_id != id) {
            remaining.push(item);
            continue;
        }
        if !item.destination.exists() {
            continue;
        }
        let result = (|| -> Result<(), String> {
            if item.source.parent() != Some(root) || !item.destination.starts_with(root) {
                return Err("Invalid recovery path.".into());
            }
            if !fs::canonicalize(&item.destination)
                .map_err(|e| e.to_string())?
                .starts_with(root)
            {
                return Err("Destination points outside this folder.".into());
            }
            if item.source.exists() {
                return Err(
                    "An original with this name already exists. Both files were kept.".into(),
                );
            }
            move_without_overwrite(&item.destination, &item.source)
        })();
        if let Err(reason) = result {
            errors.push(Failure {
                path: item.source.to_string_lossy().into_owned(),
                reason,
            });
            remaining.push(item);
        } else {
            restored += 1;
            created_dirs.extend(item.created_dirs);
        }
    }
    created_dirs.sort_by_key(|path| std::cmp::Reverse(path.components().count()));
    created_dirs.dedup();
    for directory in created_dirs {
        if directory != root
            && directory.starts_with(root)
            && directory.is_dir()
            && fs::read_dir(&directory)
                .map_err(|e| e.to_string())?
                .next()
                .is_none()
        {
            fs::remove_dir(&directory).map_err(|e| e.to_string())?;
        }
    }
    remaining.reverse();
    let tmp = root.join(".neatify-undo.tmp");
    let mut file = fs::File::create(&tmp).map_err(|e| e.to_string())?;
    for item in &remaining {
        writeln!(
            file,
            "{}",
            serde_json::to_string(item).map_err(|e| e.to_string())?
        )
        .map_err(|e| e.to_string())?;
    }
    file.sync_all().map_err(|e| e.to_string())?;
    drop(file);
    fs::rename(tmp, root.join(".neatify-moves.jsonl")).map_err(|e| e.to_string())?;
    let legacy = root.join(".neatify-history.json");
    if legacy.exists() {
        fs::remove_file(legacy).map_err(|e| e.to_string())?;
    }
    Ok(Outcome {
        organized: restored,
        failed: errors.len() as u64,
        cancelled: false,
        errors,
    })
}
#[tauri::command]
pub async fn undo_organization(
    path: String,
    session_id: Option<String>,
    private_history: Option<bool>,
    app: tauri::AppHandle,
) -> Result<Outcome, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<Engine>();
        if state.busy.swap(true, Ordering::SeqCst) {
            return Err("Wait for the current tidy to finish.".into());
        }
        let _guard = BusyGuard(&state.busy);
        let root = fs::canonicalize(&path).map_err(|e| e.to_string())?;
        let outcome = restore(&root, session_id.as_deref())?;
        let _lock = state.stats_lock.lock().map_err(|e| e.to_string())?;
        let mut stats = read_stats(&app)?;
        if outcome.organized > 0 {
            stats.undo_count += 1;
        }
        if outcome.failed == 0 {
            for event in &mut stats.events {
                if event.path == path && session_id.as_ref().is_none_or(|id| id == &event.id) {
                    event.undone = true;
                }
            }
        }
        if !private_history.unwrap_or(false) {
            stats.events.insert(
                0,
                Session {
                    id: format!("undo-{}", chrono::Utc::now().timestamp_millis()),
                    path,
                    timestamp: chrono::Utc::now().to_rfc3339(),
                    kind: "undo".into(),
                    organized: outcome.organized,
                    failed: outcome.failed,
                    cancelled: false,
                    errors: outcome.errors.clone(),
                    categories: BTreeMap::new(),
                    undone: false,
                },
            );
            stats.events.truncate(200);
        }
        save_stats(&app, &stats)?;
        Ok(outcome)
    })
    .await
    .map_err(|e| e.to_string())?
}
#[derive(Serialize)]
pub struct DropTarget {
    folder: String,
    sources: Option<Vec<String>>,
}
#[tauri::command]
pub fn resolve_drop(paths: Vec<String>) -> Result<DropTarget, String> {
    if paths.len() == 1 && Path::new(&paths[0]).is_dir() {
        return Ok(DropTarget {
            folder: paths[0].clone(),
            sources: None,
        });
    }
    let first = paths.first().ok_or("No files were dropped")?;
    let parent = Path::new(first).parent().ok_or("Invalid path")?;
    if paths
        .iter()
        .any(|p| !Path::new(p).is_file() || Path::new(p).parent() != Some(parent))
    {
        return Err("Drop files from one folder at a time, or drop a single folder.".into());
    }
    Ok(DropTarget {
        folder: parent.to_string_lossy().into_owned(),
        sources: Some(paths),
    })
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn existing_category_accepts_more_files() {
        let d = sandbox();
        fs::create_dir_all(d.join("Documents/PDF")).unwrap();
        assert!(directories_to_create(&d.join("Documents/PDF"), &d).unwrap().is_empty());
        assert_eq!(directories_to_create(&d.join("Documents/Text"), &d).unwrap(), vec![d.join("Documents/Text")]);
        fs::remove_dir_all(d).unwrap();
    }
    fn sandbox() -> PathBuf {
        let p = std::env::temp_dir().join(format!(
            "neatify-test-{}-{}",
            std::process::id(),
            rand::random::<u32>()
        ));
        fs::create_dir_all(&p).unwrap();
        fs::canonicalize(p).unwrap()
    }
    #[test]
    fn collision_exclusions_and_rules() {
        let d = sandbox();
        fs::create_dir_all(d.join("Documents/PDF")).unwrap();
        fs::write(d.join("a.pdf"), "new").unwrap();
        fs::write(d.join("Documents/PDF/a.pdf"), "old").unwrap();
        fs::write(d.join(".private"), "secret").unwrap();
        let mut rules = Rules::default();
        let p = plan(d.to_str().unwrap(), "category", &rules, None).unwrap();
        assert_eq!(p.len(), 1);
        assert!(p[0].destination.ends_with("a (1).pdf"));
        rules.excluded_extensions.push("pdf".into());
        assert!(plan(d.to_str().unwrap(), "category", &rules, None)
            .unwrap()
            .is_empty());
        rules.extensions.insert("pdf".into(), "../escape".into());
        assert!(plan(d.to_str().unwrap(), "category", &rules, None).is_err());
        fs::remove_dir_all(d).unwrap();
    }
    #[test]
    fn approved_preview_rejects_changes() {
        let d = sandbox();
        fs::write(d.join("a.txt"), "before").unwrap();
        let p = plan(d.to_str().unwrap(), "extension", &Rules::default(), None).unwrap();
        fs::write(d.join("a.txt"), "changed length").unwrap();
        let now = plan(d.to_str().unwrap(), "extension", &Rules::default(), None).unwrap();
        assert!(verify_expected(now, Some(p)).is_err());
        fs::remove_dir_all(d).unwrap();
    }
    #[test]
    fn moves_never_replace_existing_files_and_undo_is_session_scoped() {
        let d = sandbox();
        fs::create_dir(d.join("TXT Files")).unwrap();
        let a = d.join("a.txt");
        let b = d.join("TXT Files/a.txt");
        fs::write(&a, "first").unwrap();
        fs::write(&b, "existing").unwrap();
        assert!(move_without_overwrite(&a, &b).is_err());
        assert_eq!(fs::read_to_string(&a).unwrap(), "first");
        assert_eq!(fs::read_to_string(&b).unwrap(), "existing");
        fs::remove_file(&b).unwrap();
        move_without_overwrite(&a, &b).unwrap();
        let item = Move {
            source: a.clone(),
            destination: b,
            category: "TXT Files".into(),
            extension: "txt".into(),
            bytes: 5,
            modified: 0,
            session_id: "test".into(),
            created_dirs: vec![d.join("TXT Files")],
        };
        fs::write(
            d.join(".neatify-moves.jsonl"),
            format!("{}\n", serde_json::to_string(&item).unwrap()),
        )
        .unwrap();
        assert_eq!(restore(&d, Some("another")).unwrap().organized, 0);
        assert!(!a.exists());
        assert_eq!(restore(&d, Some("test")).unwrap().organized, 1);
        assert_eq!(fs::read_to_string(a).unwrap(), "first");
        assert!(!d.join("TXT Files").exists());
        fs::remove_dir_all(d).unwrap();
    }
}

#[tauri::command]
pub async fn export_activity(path: String, app: tauri::AppHandle) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<Engine>();
        let _lock = state.stats_lock.lock().map_err(|e| e.to_string())?;
        let stats = read_stats(&app)?;
        let bytes = serde_json::to_vec_pretty(&stats).map_err(|e| e.to_string())?;
        fs::write(path, bytes).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}
