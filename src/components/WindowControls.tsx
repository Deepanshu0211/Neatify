import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
export default function WindowControls() {
  const tauri = isTauri();
  return (
    <div className="window-controls">
      <button
        disabled={!tauri}
        className="window-control minimize-control"
        aria-label="Minimize window"
        onClick={() => getCurrentWindow().minimize()}
      >
        <img src="/icons/minimise.png" alt="" aria-hidden="true" />
      </button>
      <button
        disabled
        className="window-control maximize-control"
        aria-label="Maximize window"
        title="Window size is locked"
        onClick={() => getCurrentWindow().toggleMaximize()}
      >
        <img src="/icons/max.png" alt="" aria-hidden="true" />
      </button>
      <button
        disabled={!tauri}
        className="window-control close-control"
        aria-label="Close window"
        onClick={() => getCurrentWindow().close()}
      >
        <img src="/icons/close.png" alt="" aria-hidden="true" />
      </button>
    </div>
  );
}
