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
      className="folder-picker"
    >
      <div
        className={`folder-location ${folder ? "has-folder" : ""}`}
        onClick={openSelectedFolder}
      >
        <FolderOpen className="folder-icon" />
        <span className={`folder-name ${folder ? "selected" : ""}`}>
          {folder || "Click to select a folder"}
        </span>
      </div>

      <button onClick={selectFolder} className="browse-button">
        Browse
      </button>
    </motion.div>
  );
}
