// App.tsx
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import FolderPicker from "./components/FolderPicker";
import OptionsPanel from "./components/OptionsPanel";
import ProgressBar from "./components/ProgressBar";
import ConfettiEffect from "./components/ConfettiEffect";
import { Play, RotateCcw, Square } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";
import DarkVeil from './blocks/Backgrounds/DarkVeil/DarkVeil';
import AuthorCard from "./components/AuthorCard";
import LiveUsers from "./components/LiveUsers";
import WindowControls from "./components/WindowControls";

import "./App.css";



export default function App() {
  const [folder, setFolder] = useState("");
  const [progress, setProgress] = useState(0);
  const [customCategories] = useState([]);
  const [isDone, setIsDone] = useState(false);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [method, setMethod] = useState("extension");

  // Disable right-click + DevTools
  useEffect(() => {
    const blockContext = (e: MouseEvent) => e.preventDefault();
    const blockKeys = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) ||
        (e.ctrlKey && e.key === "U")
      ) {
        e.preventDefault();
        alert("No peeking 👀");
      }
    };
    document.addEventListener("contextmenu", blockContext);
    document.addEventListener("keydown", blockKeys);
    return () => {
      document.removeEventListener("contextmenu", blockContext);
      document.removeEventListener("keydown", blockKeys);
    };
  }, []);

  // Set window title

  // Progress listener
  useEffect(() => {
    const unlisten = listen<number>("progress", (event) => {
      setProgress(event.payload);
      if (event.payload === 100) {
        setIsDone(true);
        setIsOrganizing(false);
        setStatusMessage("Done! ");
        toast.success("Files organized like a boss ");
        setTimeout(() => setIsDone(false), 5000);
      } else {
        setStatusMessage(`Organizing... ${event.payload}%`);
      }
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  const handleOrganize = async () => {
    if (!folder) return toast.error("Pick a folder first 🙄");
    setProgress(0);
    setIsOrganizing(true);
    setStatusMessage("Starting...");
    toast.loading("Working magic...", { id: "org" });
    try {
      await invoke("organize_files", { path: folder, customCategories });
      toast.dismiss("org");
      toast.success("✨ Files are shiny & clean!");
    } catch {
      toast.dismiss("org");
      toast.error("Something went wrong 💀");
    }
  };

  const handleUndo = async () => {
    if (!folder) return toast.error("Pick a folder first 🙄");
    toast.loading("Rewinding time...", { id: "undo" });
    try {
      await invoke("undo_organization", { path: folder });
      toast.dismiss("undo");
      setProgress(0);
      toast.success("Undo complete ⏪");
    } catch {
      toast.dismiss("undo");
      toast.error("Undo failed 💔");
    }
  };

  const handleStop = async () => {
    await invoke("cancel_organize");
    setIsOrganizing(false);
    setProgress(0);
    setStatusMessage("Stopped ❌");
    toast("Operation canceled 😌");
  };

  return (

   
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen w-full px-4 py-10 flex flex-col items-center justify-start text-white font-pixel overflow-hidden relative"
    >
      <div
        className="absolute inset-x-0 top-0 h-8 cursor-pointer"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      />
      <AuthorCard />
      <WindowControls />
      
      
      {/* Background Veil */}
    <div className="absolute inset-0 -z-10 bg-black">
      <DarkVeil />
    </div>
      
      {/* Live Users */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "rgba(31, 31, 46, 0.8)", // translucent bg
            color: "#E9D5FF", // soft violet text
            fontFamily: "Press Start 2P, monospace",
            borderRadius: "12px",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(139, 92, 246, 0.3)", // violet border
            boxShadow: "0 4px 12px rgba(0,0,0,0.5), 0 0 10px rgba(139,92,246,0.4)",
          },
        }}
      />
    
      {/* Background Animation */}
    <motion.div
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="text-center mb-10"
    >
      <h1
        className="text-5xl md:text-7xl font-extrabold tracking-tight 
                  bg-gradient-to-r from-indigo-400 via-indigo-300 to-purple-400 
                  bg-clip-text text-transparent 
                  drop-shadow-[0_0_25px_rgba(129,140,248,0.6)] 
                  hover:drop-shadow-[0_0_40px_rgba(129,140,248,0.9)] 
                  transition-all duration-500 ease-in-out"
      >
        Neatify
      </h1>
      <p className="mt-3 text-lg md:text-xl text-gray-300 font-light italic">
        Organize your digital mess. Clean. Fast. Effortless.
      </p>
    </motion.div>


      {/* Folder Picker */}
      <div className="w-full  max-w-xl">
        <FolderPicker folder={folder} setFolder={setFolder} />
      </div>

        <div className="my-3 mt-3">
          <OptionsPanel method={method} setMethod={setMethod} />
        </div>


      {/* Action Buttons */}
      <motion.div
        className="flex flex-wrap gap-4 justify-center"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {!isOrganizing ? (
          <motion.button
            onClick={handleOrganize}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            className="px-4 py-2 rounded-xl font-medium
                      bg-white/10 hover:bg-white/20
                      border border-white/20 text-white
                      backdrop-blur-md shadow-lg flex items-center gap-2"
          >
            <Play size={18} /> Organize
          </motion.button>
        ) : (
          <motion.button
            onClick={handleStop}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            className="px-4 py-2 rounded-xl font-medium
                      bg-white/10 hover:bg-white/20
                      border border-white/20 text-white
                      backdrop-blur-md shadow-lg flex items-center gap-2"
          >
            <Square size={18} /> Stop
          </motion.button>
        )}

        <motion.button
          onClick={handleUndo}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          className="px-4 py-2 rounded-xl font-medium
                    bg-white/10 hover:bg-white/20
                    border border-white/20 text-white
                    backdrop-blur-md shadow-lg flex items-center gap-2"
        >
          <RotateCcw size={18} /> Undo
        </motion.button>
      </motion.div>
        {/* Render PreviewModal without props if it does not accept any */}
       
      {/* Progress */}
      {progress > 0 && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-xl mt-4"
        >
          <ProgressBar value={progress} />
          <p className="mt-3 text-indigo-300 text-center animate-pulse">{statusMessage}</p>
        </motion.div>
      )}
       <LiveUsers />
        
      {/* Confetti */}
      {isDone && <ConfettiEffect />}
    </motion.div>
    
  );
}
