# Desktop workspace

The workbench uses a local Silkscreen font for pixel headings, standard system text for readable controls, hand-drawn SVG pixel art, and light/dark desktop materials. No remote fonts or illustration services are required. Reduced-motion preferences stop decorative animation and confetti.

- Open a folder to read its loose files and their proposed destinations.
- Choose smart categories or individual file extensions, then preview and confirm moves.
- Undo restores recorded moves without replacing an existing original.
- Scheduler supports named folders, six presets, six-field cron, editing, pausing, deletion, and run-now.
- Schedules require Neatify to remain open and the computer awake. Missed occurrences are not replayed on startup.
- Activity totals are saved in the application's local data directory. Preferences and schedules are saved in local app storage.
- Notifications are in-app messages. Discord presence requires the Discord desktop client to be running.

Keyboard shortcuts: Ctrl/Cmd+O opens a folder; Ctrl/Cmd+Enter previews the selected folder; Ctrl/Cmd+, opens preferences; Escape dismisses dialogs. Dialogs retain keyboard focus and restore it on close.

Use `npm run tauri dev` for the desktop application. `npm run dev` provides a browser design preview with explicit desktop-only file access messaging.

Validation: `npm run build`, `cargo check --bin Neatify`, and `cargo test --bin Neatify` from `src-tauri`. Browser checks cover schedule validation/save/pause/delete, theme switching, dialog dismissal, and narrow/large layouts.
