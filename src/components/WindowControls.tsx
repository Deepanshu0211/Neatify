import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { motion } from "framer-motion";
import { Minus, Square, X } from "lucide-react";

const win = getCurrentWebviewWindow();

export default function WindowControls() {
  const minimize = () => win.minimize();
  const maximize = async () =>
    (await win.isMaximized()) ? win.unmaximize() : win.maximize();
  const close = () => win.close();

  const baseStyle =
    "w-7 h-7 flex items-center justify-center rounded-full text-white shadow-sm border border-white/30 cursor-pointer";

  return (
    <div
      className="flex gap-2 absolute top-3 right-3 px-2 py-1 rounded-xl backdrop-blur-xl bg-white/10 border border-white/20"
      style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
    >
      {/* Minimize */}
      <motion.div
        onClick={minimize}
        className={`${baseStyle} bg-yellow-500/80`}
        whileHover={{ scale: 1.1, backgroundColor: "#eab308" }}
        whileTap={{ scale: 0.9, opacity: 0.8 }}
      >
        <Minus size={14} strokeWidth={2.5} />
      </motion.div>

      {/* Maximize */}
      <motion.div
        onClick={maximize}
        className={`${baseStyle} bg-green-500/80`}
        whileHover={{ scale: 1.1, backgroundColor: "#22c55e" }}
        whileTap={{ scale: 0.9, opacity: 0.8 }}
      >
        <Square size={13} strokeWidth={2.5} />
      </motion.div>

      {/* Close */}
      <motion.div
        onClick={close}
        className={`${baseStyle} bg-red-500/100`}
        whileHover={{ scale: 1.1, backgroundColor: "#ef4444" }}
        whileTap={{ scale: 0.9, opacity: 0.8 }}
      >
        <X size={14} strokeWidth={2.5} />
      </motion.div>
    </div>
  );
}
