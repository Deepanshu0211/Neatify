import { open } from "@tauri-apps/plugin-dialog";
import { motion } from "framer-motion";
import { FolderOpen } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  folder: string;
  setFolder: (folder: string) => void;
}

export default function FolderPicker({ folder, setFolder }: Props) {
  async function selectFolder() {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select a folder to organize",
    });

    if (selected) {
      setFolder(selected as string);
      toast.success("Folder selected!");
    } else {
      toast.error("No folder selected");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-4xl flex items-center justify-between bg-gray-900 p-4 rounded-xl shadow-glow"
    >
      <div className="flex items-center gap-3 text-white font-pixel">
        <FolderOpen className="w-6 h-6 text-accent" />
        <span>{folder || "No folder selected"}</span>
      </div>
      <button
        onClick={selectFolder}
        className="px-5 py-2 bg-accent hover:bg-purple-700 text-white rounded-lg font-bold transition shadow-lg"
      >
        Browse
      </button>
    </motion.div>
  );
}
