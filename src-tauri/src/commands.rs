use serde::Serialize;
use std::{
    collections::HashMap,
    fs,
};
use std::path::Path;
use tauri::{Emitter, Window};

#[derive(Serialize)]
pub struct PreviewData {
    plan: HashMap<String, Vec<String>>,
}

#[tauri::command]
pub fn get_organization_plan(
    path: String,
    custom_categories: Vec<(String, Vec<String>)>,
) -> Result<PreviewData, String> {
    let mut plan = HashMap::new();

    let dir = Path::new(&path);
    if !dir.exists() {
        return Err("Selected folder does not exist.".into());
    }

    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let file_name = entry.file_name().to_string_lossy().to_string();
            if entry.path().is_file() {
                let ext = entry
                    .path()
                    .extension()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_lowercase();

                let mut assigned = false;
                for (category, exts) in &custom_categories {
                    if exts.contains(&ext) {
                        plan.entry(category.clone())
                            .or_insert_with(Vec::new)
                            .push(file_name.clone());
                        assigned = true;
                        break;
                    }
                }

                if !assigned {
                    plan.entry(format!("{} Files", ext.to_uppercase()))
                        .or_insert_with(Vec::new)
                        .push(file_name);
                }
            }
        }
    }

    Ok(PreviewData { plan })
}

#[tauri::command]
pub fn organize_files(
    window: Window,
    path: String,
    custom_categories: Vec<(String, Vec<String>)>,
) -> Result<(), String> {
    let dir = Path::new(&path);
    if !dir.exists() {
        return Err("Folder not found.".into());
    }

    let backup_dir = dir.join(".organizer_backup");
    fs::create_dir_all(&backup_dir).map_err(|e| e.to_string())?;

    let entries: Vec<_> = fs::read_dir(dir)
        .map_err(|e| e.to_string())?
        .filter_map(|e| e.ok())
        .filter(|e| e.path().is_file())
        .collect();

    let total = entries.len();
    if total == 0 {
        return Err("No files found in the folder.".into());
    }

    for (i, entry) in entries.iter().enumerate() {
        let file_name = entry.file_name();
        let ext = entry
            .path()
            .extension()
            .unwrap_or_default()
            .to_string_lossy()
            .to_lowercase();

        let backup_path = backup_dir.join(&file_name);
        fs::copy(entry.path(), &backup_path).map_err(|e| e.to_string())?;

        let mut dest_folder = None;
        for (category, exts) in &custom_categories {
            if exts.contains(&ext) {
                dest_folder = Some(category.clone());
                break;
            }
        }

        let folder_name = dest_folder.unwrap_or(format!("{} Files", ext.to_uppercase()));
        let new_dir = dir.join(folder_name);
        fs::create_dir_all(&new_dir).map_err(|e| e.to_string())?;

        let new_path = new_dir.join(&file_name);
        fs::rename(entry.path(), new_path).map_err(|e| e.to_string())?;

        let progress = ((i + 1) * 100 / total) as i32;
        let _ = window.emit("progress", progress);
    }

    Ok(())
}

#[tauri::command]
pub fn undo_organization(path: String) -> Result<(), String> {
    let dir = Path::new(&path);
    let backup_dir = dir.join(".organizer_backup");

    if !backup_dir.exists() {
        return Err("No backup found to undo.".into());
    }

    let backup_entries: Vec<_> = fs::read_dir(&backup_dir)
        .map_err(|e| e.to_string())?
        .filter_map(|e| e.ok())
        .collect();

    for entry in backup_entries {
        if entry.path().is_file() {
            let file_name = entry.file_name();
            let restore_path = dir.join(file_name);
            fs::copy(entry.path(), restore_path).map_err(|e| e.to_string())?;
        }
    }

    // Cleanup
    fs::remove_dir_all(&backup_dir).map_err(|e| e.to_string())?;

    Ok(())
}

