import { useEffect, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { getVersion } from "@tauri-apps/api/app";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCcw, Download, Check, XCircle, Info } from "lucide-react";

type Toast = { id: number; message: string; type: "info" | "success" | "error" };

export default function UpdateNotifier() {
  const [checking, setChecking] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string>("");
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    getVersion().then(setCurrentVersion);
    runAutoUpdate();
    const interval = setInterval(runAutoUpdate, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  let downloadedSoFar = 0;

  function showToast(message: string, type: "info" | "success" | "error" = "info") {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }

  async function runAutoUpdate() {
    if (checking) return;
    setChecking(true);

    try {
      const update = await check();

      if (update?.available) {
        showToast(`Update v${update.version}`, "info");

        await update.downloadAndInstall((event) => {
          if (event.event === "Progress") {
            const data = event.data as { chunkLength: number; contentLength?: number };
            if (data.contentLength) {
              downloadedSoFar += data.chunkLength;
              const pct = Math.round((downloadedSoFar / data.contentLength) * 100);
              console.log(`⬇️ ${pct}%`);
            }
          }
        });

        showToast("Installed", "success");
      } else {
        console.log("Already up to date:", currentVersion);
      }
    } catch (err) {
      console.error("Updater error:", err);
      showToast("Failed", "error");
    } finally {
      setChecking(false);
    }
  }

  return (
    <>
      {/* Glass Panel */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed bottom-4 left-4 flex items-center gap-3 z-40 
                   bg-black/40 backdrop-blur-xl border border-white/10 
                   rounded-2xl shadow-lg px-4 py-2"
      >
        {/* Update button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          onClick={runAutoUpdate}
          disabled={checking}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 
                     text-white px-4 py-2 rounded-xl border border-white/20 
                     shadow-md transition-all"
        >
          {checking ? (
            <>
              <RefreshCcw className="w-4 h-4 animate-spin" />
              Checking
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Update
            </>
          )}
        </motion.button>

        {/* Version badge */}
        {currentVersion && (
          <span className="text-xs font-mono px-3 py-1 rounded-full 
                           bg-white/10 text-white/80 border border-white/20 
                           shadow-inner">
            v{currentVersion}
          </span>
        )}
      </motion.div>

      {/* Toasts */}
      <div className="fixed bottom-20 left-4 flex flex-col gap-2 z-50">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl 
                         bg-black/50 backdrop-blur-xl border border-white/10 
                         text-white text-sm shadow-lg w-fit max-w-xs"
            >
              {toast.type === "success" && <Check className="w-4 h-4 text-white/70" />}
              {toast.type === "error" && <XCircle className="w-4 h-4 text-white/70" />}
              {toast.type === "info" && <Info className="w-4 h-4 text-white/70" />}
              <span className="whitespace-nowrap">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
