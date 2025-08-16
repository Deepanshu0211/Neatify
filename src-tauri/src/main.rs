#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::{
    collections::HashMap,
    fs,
    path::Path,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
};

use discord_rich_presence::{activity, DiscordIpc, DiscordIpcClient};
use tauri::{Emitter, Manager};
use tokio::time::{sleep, Duration};

struct AppState {
    cancel_flag: Arc<AtomicBool>,
}

#[tauri::command]
async fn organize_files(
    path: String,
    window: tauri::Window,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    state.cancel_flag.store(false, Ordering::Relaxed);

    let entries = fs::read_dir(&path).map_err(|e| e.to_string())?;
    let files: Vec<_> = entries.filter_map(Result::ok).collect();
    let total = files.len();

    if total == 0 {
        return Err("No files found in the selected folder".into());
    }

    // Category mapping: ext → (MainFolder, SubFolder)
    let categories: HashMap<&str, (&str, &str)> = [
        // Documents
        ("pdf", ("Documents", "PDF")),
        ("doc", ("Documents", "Word")),
        ("docx", ("Documents", "Word")),
        ("txt", ("Documents", "Text")),
        ("xls", ("Documents", "Excel")),
        ("xlsx", ("Documents", "Excel")),
        ("ppt", ("Documents", "PowerPoint")),
        ("pptx", ("Documents", "PowerPoint")),
        // Images
        ("jpg", ("Media", "Images")),
        ("jpeg", ("Media", "Images")),
        ("png", ("Media", "Images")),
        ("gif", ("Media", "Images")),
        ("bmp", ("Media", "Images")),
        ("svg", ("Media", "Images")),
        ("webp", ("Media", "Images")),
        // Videos
        ("mp4", ("Media", "Videos")),
        ("mkv", ("Media", "Videos")),
        ("avi", ("Media", "Videos")),
        ("mov", ("Media", "Videos")),
        ("flv", ("Media", "Videos")),
        // Audio
        ("mp3", ("Media", "Audio")),
        ("wav", ("Media", "Audio")),
        ("flac", ("Media", "Audio")),
        ("aac", ("Media", "Audio")),
        ("ogg", ("Media", "Audio")),
        // Archives
        ("zip", ("Archives", "")),
        ("rar", ("Archives", "")),
        ("7z", ("Archives", "")),
        ("tar", ("Archives", "")),
        ("gz", ("Archives", "")),
        // Applications
        ("exe", ("Applications", "")),
        ("msi", ("Applications", "")),
        ("apk", ("Applications", "")),
        ("bat", ("Applications", "")),
        // Code
        ("js", ("Code", "")),
        ("ts", ("Code", "")),
        ("jsx", ("Code", "")),
        ("tsx", ("Code", "")),
        ("html", ("Code", "")),
        ("css", ("Code", "")),
        ("py", ("Code", "")),
        ("java", ("Code", "")),
        ("c", ("Code", "")),
        ("cpp", ("Code", "")),
        ("cs", ("Code", "")),
        ("json", ("Code", "")),
    ]
    .iter()
    .cloned()
    .collect();

    let mut processed = 0;
    let mut log_entries = Vec::new();

    for entry in files {
        if state.cancel_flag.load(Ordering::Relaxed) {
            println!("Organizing stopped by user.");
            break;
        }

        let file_name = entry.file_name();
        let file_path = entry.path();

        if file_path.is_file() {
            if let Some(ext) = file_path.extension() {
                let ext_str = ext.to_string_lossy().to_lowercase();
                let (main_folder, sub_folder) =
                    categories.get(ext_str.as_str()).unwrap_or(&("Others", ""));

                let dest_folder = if sub_folder.is_empty() {
                    Path::new(&path).join(main_folder)
                } else {
                    Path::new(&path).join(main_folder).join(sub_folder)
                };

                fs::create_dir_all(&dest_folder).map_err(|e| e.to_string())?;
                let dest_path = dest_folder.join(&file_name);

                fs::rename(&file_path, &dest_path).map_err(|e| e.to_string())?;
                log_entries.push(format!("{}|{}", dest_path.display(), file_path.display()));
            } else {
                let dest_folder = Path::new(&path).join("Others");
                fs::create_dir_all(&dest_folder).map_err(|e| e.to_string())?;
                let dest_path = dest_folder.join(&file_name);

                fs::rename(&file_path, &dest_path).map_err(|e| e.to_string())?;
                log_entries.push(format!("{}|{}", dest_path.display(), file_path.display()));
            }
        }

        processed += 1;
        let progress = (processed as f64 / total as f64) * 100.0;
        window.emit("progress", progress as i32).ok();
        sleep(Duration::from_millis(150)).await;
    }

    // Save undo log
    let log_path = Path::new(&path).join(".neatify_log");
    fs::write(&log_path, log_entries.join("\n")).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn cancel_organize(state: tauri::State<AppState>) {
    state.cancel_flag.store(true, Ordering::Relaxed);
}

#[tauri::command]
async fn undo_organization(path: String, window: tauri::Window) -> Result<(), String> {
    let log_path = Path::new(&path).join(".neatify_log");
    if !log_path.exists() {
        return Err("No undo log found.".into());
    }

    let content = fs::read_to_string(&log_path).map_err(|e| e.to_string())?;
    let moves: Vec<&str> = content.lines().collect();
    let total = moves.len();
    let mut processed = 0;

    for line in moves {
        if let Some((moved, original)) = line.split_once("|") {
            let _ = fs::create_dir_all(Path::new(original).parent().unwrap());
            fs::rename(moved, original).ok();
        }
        processed += 1;
        let progress = (processed as f64 / total as f64) * 100.0;
        window.emit("progress", progress as i32).ok();
        sleep(Duration::from_millis(100)).await;
    }

    fs::remove_file(&log_path).ok();
    Ok(())
}
#[tokio::main]
async fn main() {
    // ✅ Initialize Discord RPC
    tokio::spawn(async move {
        let mut client = DiscordIpcClient::new("1398850195109839081").unwrap();

        if let Err(e) = client.connect() {
            eprintln!("Failed to connect to Discord: {}", e);
            return;
        }

        if let Err(e) = client.set_activity(
            activity::Activity::new()
                .state("by deepsomnia_")
                .details("Neatify - Organizing Files")
                .assets(
                    activity::Assets::new()
                        .large_image("neatify_logo") // You must upload this in Discord Developer Portal
                        .large_text("Neatify App"),
                ),
        ) {
            eprintln!("Failed to set Discord activity: {}", e);
        }

        loop {
            sleep(Duration::from_secs(15)).await;
        }
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState {
            cancel_flag: Arc::new(AtomicBool::new(false)),
        })
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            organize_files,
            cancel_organize,
            undo_organization
        ])
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                window.show().unwrap();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
