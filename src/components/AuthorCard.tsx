import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Github, Linkedin, UserPlus, MessageCircle, Check } from "lucide-react";

interface DiscordData {
  discord_user: {
    username: string;
    discriminator: string;
    avatar: string;
  };
  discord_status: "online" | "dnd" | "offline";
}

export default function AuthorInfo() {
  const [open, setOpen] = useState(false);
  const [discord, setDiscord] = useState<DiscordData | null>(null);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const DISCORD_ID = "755733650435342347";

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        const json = await res.json();
        if (json.success) setDiscord(json.data);
      } catch (err) {
        console.error("Failed to fetch Discord status:", err);
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const statusColor: Record<string, string> = {
    online: "bg-green-500",
    dnd: "bg-red-500",
    offline: "bg-gray-500",
  };

  const avatarUrl = discord
    ? `https://cdn.discordapp.com/avatars/${DISCORD_ID}/${discord.discord_user.avatar}.png`
    : null;

  const copyDiscordTag = () => {
    if (!discord) return;
    const tag = `${discord.discord_user.username}#${discord.discord_user.discriminator}`;
    navigator.clipboard.writeText(tag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed top-4 right-4 z-50" ref={cardRef}>
      {/* Floating Avatar Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative w-10 h-10 rounded-full overflow-hidden border border-white/20 shadow-lg"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="Discord Avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
            ?
          </div>
        )}
        {/* Status dot */}
        <span
          className={`absolute bottom-1 right-1 w-3 h-3 rounded-full border-2 border-[#1e1e2e] ${
            statusColor[discord?.discord_status || "offline"]
          }`}
        />
      </button>

      {/* Card */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            
            transition={{ duration: 0.25 }}
            className="absolute mt-2 right-0 w-48 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl text-sm"
          >
            {/* User Info */}
            <div className="flex items-center gap-2 mb-3">
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Discord Avatar"
                    className="w-10 h-10 rounded-full border border-white/20"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-xs text-white">
                    ?
                  </div>
                )}
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1e1e2e] ${
                    statusColor[discord?.discord_status || "offline"]
                  }`}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-medium text-xs">
                  {discord ? discord.discord_user.username : "Loading..."}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <motion.button
                whileHover={{ scale: 1.2 }}
                onClick={copyDiscordTag}
                className="p-2 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white"
                title="Add Friend"
              >
                {copied ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              </motion.button>

              <motion.a
                whileHover={{ scale: 1.2 }}
                href={`discord://-/users/${DISCORD_ID}`}
                className="p-2 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white"
                title="Message"
              >
                <MessageCircle className="w-4 h-4" />
              </motion.a>

              <motion.a
                whileHover={{ scale: 1.2 }}
                href="https://github.com/deepanshu0211"
                target="_blank"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white"
                title="GitHub"
              >
                <Github className="w-4 h-4" />
              </motion.a>

              <motion.a
                whileHover={{ scale: 1.2 }}
                href="https://www.linkedin.com/in/deepanshuyad/"
                target="_blank"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white"
                title="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
