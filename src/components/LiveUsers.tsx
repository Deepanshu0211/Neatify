import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users } from "lucide-react";

export default function LiveUsers() {
  const [online, setOnline] = useState(0);

  useEffect(() => {
    const evtSource = new EventSource(
      "https://neatify-stats-server-1.onrender.com/stats"
    );

    evtSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setOnline(data.online);
    };

    evtSource.onerror = () => evtSource.close();

    // Track this client
    fetch("https://neatify-stats-server-1.onrender.com/track").catch(() => {});

    return () => evtSource.close();
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="flex items-center px-3 py-2 rounded-xl bg-gray-900/70 backdrop-blur-md shadow-lg border border-gray-700/50">
        {/* Icon with soft pulse */}
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Users className="text-violet-400 w-5 h-5 drop-shadow-[0_0_8px_rgba(167,139,250,0.6)]" />
        </motion.div>

        {/* Count + Label */}
        <div className="flex flex-col items-start ml-2">
          <AnimatePresence mode="wait">
            <motion.span
              key={online}
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 6, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-violet-300 font-bold text-lg leading-none tracking-tight"
            >
              {online}
            </motion.span>
          </AnimatePresence>
          <p className="text-gray-400 text-[11px] leading-none">users online</p>
        </div>
      </div>
    </div>
  );
}
