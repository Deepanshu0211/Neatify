use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};

#[derive(Default)]
pub struct NativeState {
    tray: AtomicBool,
}
#[tauri::command]
pub fn set_tray_preference(
    enabled: bool,
    app: tauri::AppHandle,
    state: tauri::State<NativeState>,
) -> Result<(), String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    std::fs::write(
        dir.join("tray-preference.json"),
        if enabled { "true" } else { "false" },
    )
    .map_err(|e| e.to_string())?;
    state.tray.store(enabled, Ordering::Relaxed);
    Ok(())
}
fn show(app: &tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.show();
        let _ = w.unminimize();
        let _ = w.set_focus();
    }
}
pub fn setup(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let enabled = std::fs::read_to_string(app.path().app_data_dir()?.join("tray-preference.json"))
        .unwrap_or_default()
        == "true";
    app.state::<NativeState>()
        .tray
        .store(enabled, Ordering::Relaxed);
    let open = MenuItem::with_id(app, "show", "Open Neatify", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit Neatify", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&open, &quit])?;
    TrayIconBuilder::new()
        .icon(tauri::image::Image::from_bytes(include_bytes!(
            "../../assets/mascot/windows/32x32.png"
        ))?)
        .tooltip("Neatify — your files, right where they belong")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => show(app),
            "quit" => {
                if app
                    .state::<crate::engine::Engine>()
                    .busy
                    .load(Ordering::SeqCst)
                {
                    show(app);
                    let _ = app.emit(
                        "operation-active",
                        "Finish or stop the current tidy before quitting.",
                    );
                } else {
                    app.exit(0);
                }
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show(tray.app_handle());
            }
        })
        .build(app)?;
    if let Some(w) = app.get_webview_window("main") {
        w.show()?;
    }
    Ok(())
}
pub fn window_event(window: &tauri::Window, event: &tauri::WindowEvent) {
    let app = window.app_handle();
    let enabled = app.state::<NativeState>().tray.load(Ordering::Relaxed);
    match event {
        tauri::WindowEvent::CloseRequested { api, .. } => {
            if enabled {
                api.prevent_close();
                let _ = window.hide();
            } else if app
                .state::<crate::engine::Engine>()
                .busy
                .load(Ordering::SeqCst)
            {
                api.prevent_close();
                let _ = window.emit(
                    "operation-active",
                    "Finish or stop the current tidy before closing.",
                );
            }
        }
        tauri::WindowEvent::Resized(_) if enabled && window.is_minimized().unwrap_or(false) => {
            let _ = window.hide();
        }
        _ => {}
    }
}
