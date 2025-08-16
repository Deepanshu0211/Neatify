import { open } from "@tauri-apps/plugin-dialog";
import { open as openFolder } from "@tauri-apps/plugin-shell";
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

  async function openSelectedFolder() {
    if (folder) {
      try {
        await openFolder(folder);
      } catch (error) {
        toast.error("Could not open folder.");
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-4xl flex items-center justify-between 
                 bg-black/20 backdrop-blur-md border border-white/10 
                 p-4 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
    >
      <div
        className={`flex items-center gap-3 p-3 rounded-xl 
                    bg-black/10 backdrop-blur-sm border border-white/5 
                    text-white font-pixel cursor-pointer transition 
                    ${folder ? "hover:bg-black/20" : ""}`}
        onClick={openSelectedFolder}
      >
        <FolderOpen className="w-6 h-6 text-gray-300" />
        <span
          className={`truncate ${folder ? "text-white" : "text-gray-400 italic"}`}
        >
          {folder || "Click to select a folder"}
        </span>
      </div>

      <button
        onClick={selectFolder}
        className="px-4 py-2 rounded-lg font-medium 
                  bg-black/20 hover:bg-black/30 
                  text-white border border-white/10 
                  backdrop-blur-sm transition-all duration-200"
      >
        Browse
      </button>
    </motion.div>
  );
}
