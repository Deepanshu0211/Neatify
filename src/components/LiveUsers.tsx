import { useEffect } from "react";
import { check } from "@tauri-apps/plugin-updater";

export default function UpdateNotifier() {

  // Simple toast function
  function showToast(message: string) {
    const toast = document.createElement("div");
    toast.innerText = message;
    toast.className = "fixed bottom-20 left-4 bg-blue-600 text-white px-4 py-2 rounded shadow z-50 animate-slide-up";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  async function runAutoUpdate() {
    try {
      const update = await check();
      if (update?.available) {
        showToast(`🚀 Update found: ${update.version}, installing...`);
        await update.downloadAndInstall();
      } else {
        showToast("✅ Already on latest version");
      }
    } catch (err) {
      showToast("❌ Update check failed");
      console.error(err);
    }
  }

  useEffect(() => {
    runAutoUpdate();
    const interval = setInterval(runAutoUpdate, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <button
      onClick={runAutoUpdate}
      className="fixed bottom-4 left-4 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded shadow transition-colors duration-200 z-50"
    >
      ⬆️ Update
    </button>
  );
}
