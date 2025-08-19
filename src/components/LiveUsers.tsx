import { useEffect, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { getVersion } from "@tauri-apps/api/app";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCcw,
  Download,
  Check,
  XCircle,
  Info,
  FileText,
  Clock,
} from "lucide-react";

// Toast type
type Toast = {
  id: number;
  message: string;
  type: "info" | "success" | "error";
  action?: () => void;
};

export default function UpdateNotifier() {
  const [checking, setChecking] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string>("");
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [changelog, setChangelog] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    getVersion().then(setCurrentVersion);
    runAutoUpdate(false); // initial silent check

    const interval = setInterval(() => runAutoUpdate(false), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  function formatTime(date: Date) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function showToast(
    message: string,
    type: "info" | "success" | "error" = "info",
    action?: () => void
  ) {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, action }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }

  async function runAutoUpdate(showUpToDate = true) {
    if (checking) return;
    setChecking(true);
    setLastChecked(formatTime(new Date()));

    try {
      const update = await check();

      if (update?.available) {
        setUpdateVersion(update.version);
        if (showUpToDate)
          showToast(`Update available: v${update.version}`, "info");
        fetchChangelog(update.version);
      } else {
        setUpdateVersion(null);
        if (showUpToDate) showToast("Already up to date", "success");
      }
    } catch (err) {
      console.error("Updater error:", err);
      showToast("Update check failed", "error", () => runAutoUpdate(true));
    } finally {
      setChecking(false);
    }
  }

  async function fetchChangelog(version: string) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/Deepanshu0211/Neatify/releases/tags/v${version}`
      );
      if (!res.ok) {
        setChangelog("Could not load changelog.");
        return;
      }
      const data = await res.json();
      setChangelog(data.body || "No changelog provided.");
    } catch {
      setChangelog("Could not load changelog.");
    }
  }

  async function installUpdate() {
    if (!updateVersion) return;

    try {
      showToast(`Downloading v${updateVersion}...`, "info");
      const update = await check();
      let downloadedSoFar = 0;

      await update?.downloadAndInstall((event) => {
        if (event.event === "Progress") {
          const data = event.data as {
            chunkLength: number;
            contentLength?: number;
          };
          if (data.contentLength) {
            downloadedSoFar += data.chunkLength;
            const pct = Math.min(
              100,
              Math.round((downloadedSoFar / data.contentLength) * 100)
            );
            setProgress(pct);
          }
        }
      });

      setProgress(null);
      showToast("Update installed ✨ Restarting...", "success");
    } catch (err) {
      console.error("Install error:", err);
      setProgress(null);
      showToast("Install failed", "error", installUpdate);
    }
  }

  return (
    <>
      {/* Compact Glass Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed bottom-2 left-2 z-40 flex items-center gap-2
                   bg-black/40 backdrop-blur-lg border border-white/10 
                   rounded-lg shadow-md px-2 py-1.5 text-xs max-w-[260px]"
      >
        {/* Update button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          onClick={
            updateVersion ? () => setShowModal(true) : () => runAutoUpdate(true)
          }
          disabled={checking || progress !== null}
          className={`flex items-center gap-1 px-2 py-1 rounded-md border shadow-sm transition-all text-xs
            ${
              updateVersion
                ? "bg-green-500/20 border-green-400 text-green-200 animate-pulse"
                : "bg-white/10 hover:bg-white/20 border-white/20 text-white"
            }
          `}
        >
          {progress !== null ? (
            <>
              <RefreshCcw className="w-3 h-3 animate-spin" />
              {progress}%
            </>
          ) : checking ? (
            <>
              <RefreshCcw className="w-3 h-3 animate-spin" />
              Checking
            </>
          ) : updateVersion ? (
            <>
              <Download className="w-3 h-3" />
              v{updateVersion}
            </>
          ) : (
            <>
              <RefreshCcw className="w-3 h-3" />
              Check
            </>
          )}
        </motion.button>

        {/* Version badge */}
        {currentVersion && (
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-md border
              ${
                updateVersion
                  ? "bg-yellow-500/10 text-yellow-200 border-yellow-400/30"
                  : "bg-white/10 text-white/70 border-white/20"
              }
            `}
          >
            v{currentVersion}
          </span>
        )}

        {/* Last checked */}
        {lastChecked && (
          <div className="flex items-center text-[10px] text-white/50">
            <Clock className="w-3 h-3 mr-1" />
            {lastChecked}
          </div>
        )}
      </motion.div>

      {/* Progress bar */}
      {progress !== null && (
        <motion.div
          key="progress-bar"
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: "easeInOut", duration: 0.2 }}
          className="fixed bottom-0 left-0 h-0.5 bg-green-400 z-50 shadow-lg"
        />
      )}

      {/* Toasts */}
      <div className="fixed bottom-14 left-2 flex flex-col gap-1 z-50">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="flex items-center gap-2 px-2 py-1 rounded-md 
                         bg-black/60 backdrop-blur-lg border border-white/10 
                         text-white text-xs shadow-md w-fit max-w-[200px]"
            >
              {toast.type === "success" && (
                <Check className="w-3 h-3 text-green-400" />
              )}
              {toast.type === "error" && (
                <XCircle className="w-3 h-3 text-red-400" />
              )}
              {toast.type === "info" && (
                <Info className="w-3 h-3 text-blue-400" />
              )}
              <span>{toast.message}</span>
              {toast.action && (
                <button
                  onClick={toast.action}
                  className="ml-1 text-[10px] underline text-blue-300 hover:text-blue-200"
                >
                  Retry
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Changelog Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-6 max-w-lg w-full text-white"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5" /> What’s new in v{updateVersion}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/60 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto whitespace-pre-wrap text-sm text-white/80">
                {changelog || "Loading..."}
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
                >
                  Remind me later
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    installUpdate();
                  }}
                  className="px-3 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-sm"
                >
                  Install Update
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
