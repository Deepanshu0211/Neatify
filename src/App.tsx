import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useDeferredValue,
} from "react";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  downloadDir,
  desktopDir,
  documentDir,
  pictureDir,
} from "@tauri-apps/api/path";
import { MotionConfig, AnimatePresence, motion } from "framer-motion";
import {
  Folder,
  FolderOpen,
  CalendarDays,
  Activity,
  Settings2,
  PanelLeft,
  PanelRight,
  Search,
  ArrowRight,
  RotateCcw,
  Square,
  LockKeyhole,
  X,
  Clock3,
  Eye,
  Sparkles,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Scheduler from "./components/Scheduler";
import StatsDashboard from "./components/StatsDashboard";
import PreferencesPanel from "./components/PreferencesPanel";
import VirtualFileList from "./components/VirtualFileList";
import Sheet from "./components/Sheet";
import AmbientScene from "./components/AmbientScene";
import NeatifyMascot from "./components/NeatifyMascot";
import WindowControls from "./components/WindowControls";
import { useAmbientState } from "./lib/useAmbientState";
import {
  command,
  desktop,
  emptyStats,
  folderName,
  loadSchedules,
  Move,
  nextRun,
  Outcome,
  pickFolder,
  Schedule,
  setting,
  Stats,
  Session,
} from "./lib/workspace";
import { loadPreferences, rulesFor } from "./lib/preferences";
import "@fontsource/silkscreen/400.css";
import "./App.css";
import LivingRoom from "./components/LivingRoom";
import { Opening, ModeChooser, AppMode } from "./components/Welcome";
import "./components/RoomPolish.css";

const phaseCopy = {
  night: { label: "Night mode", greeting: "A quiet night for a tidy desk" },
  dawn: { label: "First light", greeting: "A calm start to the day" },
  sunrise: { label: "Sunrise", greeting: "Fresh light, fresh space" },
  morning: { label: "Morning", greeting: "Make a little room for the day" },
  day: { label: "Daylight", greeting: "A bright moment to get organized" },
  afternoon: { label: "Afternoon", greeting: "Clear the clutter, keep the flow" },
  sunset: { label: "Golden hour", greeting: "Wind down with a cleaner space" },
  dusk: { label: "Blue hour", greeting: "Settle everything into its place" },
} as const;

export default function App() {
  const [mode, setMode] = useState<AppMode | null>(() => {
    const saved = localStorage.getItem("neatify-app-mode");
    return saved === "room" || saved === "classic" ? saved : null;
  });
  const [opening, setOpening] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setOpening(false), 3500);
    return () => clearTimeout(timer);
  }, []);
  function chooseMode(next: AppMode) {
    localStorage.setItem("neatify-app-mode", next);
    setMode(next);
    setRoomPanel(false);
  }
  const [roomPanel, setRoomPanel] = useState(false);
  const [page, setPage] = useState("desk"),
    [folder, setFolder] = useState(
      () => localStorage.getItem("neatify-last-folder") || "",
    ),
    [method, setMethod] = useState("category");
  const [prefs, setPrefs] = useState(loadPreferences),
    [dark, setDark] = useState(false),
    [settings, setSettings] = useState(false),
    [notifications, setNotifications] = useState(() =>
      setting("neatify-notifications", true),
    );
  const [sidebar, setSidebar] = useState(() =>
      setting("neatify-sidebar", true),
    ),
    [inspector, setInspector] = useState(() =>
      setting("neatify-inspector", true),
    ),
    [width, setWidth] = useState(() =>
      Math.max(
        220,
        Math.min(
          300,
          Number(localStorage.getItem("neatify-sidebar-width")) || 232,
        ),
      ),
    );
  const [schedules, setSchedules] = useState<Schedule[]>(loadSchedules),
    [stats, setStats] = useState<Stats>(emptyStats),
    [statsLoading, setStatsLoading] = useState(false);
  const [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0),
    [status, setStatus] = useState(""),
    [error, setError] = useState(""),
    [done, setDone] = useState(false);
  const [files, setFiles] = useState<Move[]>([]),
    [scan, setScan] = useState(false),
    [version, setVersion] = useState(0),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState<Move | null>(null);
  const [preview, setPreview] = useState<{
      files: Move[];
      path: string;
      method: string;
    } | null>(null),
    [previewLoading, setPreviewLoading] = useState(false),
    [undo, setUndo] = useState<{ path: string; id?: string } | null>(null);
  const [sleeping, setSleeping] = useState(false);
  const [sources, setSources] = useState<string[] | null>(null),
    [dragging, setDragging] = useState(false);
  const busyRef = useRef(false),
    schedulesRef = useRef(schedules),
    previewRef = useRef(preview);
  const audioRef = useRef<AudioContext | null>(null);
  previewRef.current = preview;
  const ambient = useAmbientState();
  const timeCopy = phaseCopy[ambient.phase];
  const localTime = useMemo(
    () =>
      new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
    [ambient.hour, ambient.phaseProgress],
  );
  const rules = useMemo(() => rulesFor(prefs), [prefs]),
    deferredQuery = useDeferredValue(query);
  const filtered = useMemo(
    () =>
      files.filter((f) =>
        folderName(f.source)
          .toLowerCase()
          .includes(deferredQuery.toLowerCase()),
      ),
    [files, deferredQuery],
  );
  const updateSchedules = useCallback((items: Schedule[]) => {
    schedulesRef.current = items;
    setSchedules(items);
    localStorage.setItem("neatify-schedules-v2", JSON.stringify(items));
  }, []);
  const refresh = useCallback(async () => {
    if (!desktop) return;
    setStatsLoading(true);
    try {
      setStats(await command<Stats>("fetch_stats"));
    } catch (e) {
      setError(String(e));
    } finally {
      setStatsLoading(false);
    }
  }, []);
  const playSound = useCallback(
    (kind: "tap" | "success" | "error") => {
      if (!prefs.sound || typeof window === "undefined") return;
      const AudioContextConstructor = window.AudioContext;
      if (!AudioContextConstructor) return;
      const audio =
        audioRef.current || (audioRef.current = new AudioContextConstructor());
      void audio.resume();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const frequencies = { tap: 520, success: 740, error: 180 };
      const duration = kind === "tap" ? 0.08 : 0.16;
      const now = audio.currentTime;
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(frequencies[kind], now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.035, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(now);
      oscillator.stop(now + duration);
    },
    [prefs.sound],
  );
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    localStorage.setItem("neatify-preferences", JSON.stringify(prefs));
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () =>
      setDark(
        prefs.theme === "dark" || (prefs.theme === "system" && media.matches),
      );
    apply();
    media.addEventListener("change", apply);
    if (desktop)
      void getCurrentWindow()
        .setTheme(prefs.theme === "system" ? null : prefs.theme)
        .catch((e) => setError(String(e)));
    return () => media.removeEventListener("change", apply);
  }, [prefs]);
  useEffect(() => {
    localStorage.setItem("neatify-last-folder", folder);
    setSelected(null);
    setQuery("");
  }, [folder]);
  useEffect(() => {
    localStorage.setItem("neatify-sidebar", String(sidebar));
    localStorage.setItem("neatify-inspector", String(inspector));
    localStorage.setItem("neatify-sidebar-width", String(width));
    localStorage.setItem("neatify-notifications", String(notifications));
  }, [sidebar, inspector, width, notifications]);
  useEffect(() => {
    let stale = false;
    if (!folder || !desktop) {
      setFiles([]);
      return;
    }
    setScan(true);
    command<Move[]>("get_organization_plan", {
      path: folder,
      method,
      rules,
      sources,
    })
      .then((items) => {
        if (!stale) setFiles(items);
      })
      .catch((e) => {
        if (!stale) {
          setError(String(e));
          setFiles([]);
        }
      })
      .finally(() => {
        if (!stale) setScan(false);
      });
    return () => {
      stale = true;
    };
  }, [folder, method, rules, sources, version]);
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => setDone(false), 3000);
    return () => clearTimeout(timer);
  }, [done]);
  const run = useCallback(
    async (path: string, style: string, task?: Schedule, expected?: Move[]) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      setProgress(0);
      setError("");
      setDone(false);
      setStatus("Finding a home for your files…");
      let result = "";
      try {
        const outcome = await command<Outcome>("organize_files", {
          path,
          method: style,
          rules,
          sources: task ? null : sources,
          expected: expected || null,
        });
        result = `${outcome.organized} files organized${outcome.failed ? ` · ${outcome.failed} failed` : ""}${outcome.cancelled ? " · stopped" : ""}`;
        setStatus(result);
        setDone(outcome.organized > 0 && !outcome.cancelled);
        if (outcome.failed)
          setError(
            outcome.errors.map((f) => `${f.path}: ${f.reason}`).join("\n"),
          );
        if (outcome.failed) playSound("error");
        else if (outcome.organized) playSound("success");
        if (notifications && !outcome.failed) toast.success(result);
      } catch (e) {
        result = String(e);
        playSound("error");
        setError(result);
        setStatus("This tidy needs your attention.");
      } finally {
        if (task)
          updateSchedules(
            schedulesRef.current.map((s) =>
              s.id === task.id
                ? { ...s, lastRun: new Date().toISOString(), result }
                : s,
            ),
          );
        busyRef.current = false;
        setBusy(false);
        setVersion((v) => v + 1);
        void refresh();
      }
    },
    [rules, sources, notifications, refresh, updateSchedules, playSound],
  );
  useEffect(() => {
    if (!desktop) return;
    const timer = setInterval(() => {
      if (busyRef.current || previewRef.current) return;
      const task = schedulesRef.current.find(
        (s) => s.enabled && new Date(s.nextRun).getTime() <= Date.now(),
      );
      if (!task) return;
      try {
        updateSchedules(
          schedulesRef.current.map((s) =>
            s.id === task.id ? { ...s, nextRun: nextRun(s.cron) } : s,
          ),
        );
        void run(task.folder, task.method, task);
      } catch {
        updateSchedules(
          schedulesRef.current.map((s) =>
            s.id === task.id
              ? {
                  ...s,
                  enabled: false,
                  result: "Edit this invalid schedule to resume.",
                }
              : s,
          ),
        );
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [run, updateSchedules]);
  useEffect(() => {
    if (!desktop) return;
    const progressListener = listen<number>("progress", (e) =>
      setProgress(e.payload),
    );
    const active = listen("operation-active", () =>
      setError(
        "Stop the current operation or wait for it to finish before quitting.",
      ),
    );
    const drag = getCurrentWindow().onDragDropEvent((e) => {
      setDragging(e.payload.type === "enter" || e.payload.type === "over");
      if (e.payload.type === "drop" && !busyRef.current && !previewRef.current)
        void command<{ folder: string; sources: string[] | null }>(
          "resolve_drop",
          { paths: e.payload.paths },
        )
          .then((result) => {
            setFolder(result.folder);
            setSources(result.sources);
            setPage("desk");
            setError("");
          })
          .catch((e) => setError(String(e)));
    });
    return () => {
      void progressListener.then((fn) => fn());
      void active.then((fn) => fn());
      void drag.then((fn) => fn());
    };
  }, []);
  useEffect(() => {
    if (!desktop || !prefs.autoOrganize || !folder || sources) return;
    let disposed = false,
      checking = false,
      baseline: Set<string> | null = null,
      previous = new Map<string, string>();
    const tick = async () => {
      if (checking || busyRef.current || previewRef.current) return;
      checking = true;
      try {
        const items = await command<Move[]>("get_organization_plan", {
          path: folder,
          method,
          rules,
        });
        if (disposed) return;
        const current = new Map(
          items.map((f) => [f.source, `${f.bytes}:${f.modified}`]),
        );
        if (!baseline) {
          baseline = new Set(current.keys());
          previous = current;
          return;
        }
        const ready = items.filter(
          (f) =>
            !baseline!.has(f.source) &&
            previous.get(f.source) === current.get(f.source),
        );
        previous = current;
        if (ready.length) {
          await run(folder, method, undefined, ready);
          ready.forEach((f) => baseline!.add(f.source));
        }
      } catch (e) {
        if (!disposed) setError(String(e));
      } finally {
        checking = false;
      }
    };
    void tick();
    const timer = setInterval(() => void tick(), 10000);
    return () => {
      disposed = true;
      clearInterval(timer);
    };
  }, [prefs.autoOrganize, folder, sources, method, rules, run]);
  async function chooseFolder() {
    try {
      const path = await pickFolder();
      if (path) {
        setRoomPanel(true);
        playSound("tap");
        setFolder(path);
        setSources(null);
        setStatus("");
        setError("");
        setPage("desk");
      }
    } catch (e) {
      setError(String(e));
    }
  }
  function clearFolder() {
    playSound("tap");
    setFolder("");
    setSources(null);
    setSelected(null);
    setQuery("");
    setStatus("");
    setError("");
  }
  async function openLocation(resolve: () => Promise<string>) {
    try {
      if (!desktop)
        throw new Error("Quick locations are available in the desktop app.");
      setFolder(await resolve());
      setSources(null);
      setPage("desk");
      setError("");
    } catch (e) {
      setError(String(e));
    }
  }
  async function showPreview() {
    setError("");
    setPreviewLoading(true);
    try {
      const items = await command<Move[]>("get_organization_plan", {
        path: folder,
        method,
        rules,
        sources,
      });
      if (items.length) setPreview({ files: items, path: folder, method });
      else setStatus("No loose files to organize.");
    } catch (e) {
      setError(String(e));
    } finally {
      setPreviewLoading(false);
    }
  }
  async function restore() {
    if (!undo || busyRef.current) return;
    const target = undo;
    setUndo(null);
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await command<Outcome>("undo_organization", {
        path: target.path,
        sessionId: target.id || null,
        privateHistory: prefs.privateHistory,
      });
      setStatus(`${result.organized} files restored.`);
      if (result.failed)
        setError(result.errors.map((f) => `${f.path}: ${f.reason}`).join("\n"));
      else if (notifications) toast.success("Files restored.");
    } catch (e) {
      setError(String(e));
    } finally {
      busyRef.current = false;
      setBusy(false);
      setVersion((v) => v + 1);
      void refresh();
    }
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || settings || preview || undo) return;
      if (e.key.toLowerCase() === "o" && !busy) {
        e.preventDefault();
        void chooseFolder();
      }
      if (e.key === ",") {
        e.preventDefault();
        setSettings(true);
      }
      if (e.key === "Enter" && folder && !busy && !previewLoading) {
        e.preventDefault();
        void showPreview();
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  });
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const wake = () => {
      setSleeping(false);
      clearTimeout(timer);
      timer = setTimeout(() => setSleeping(true), 60000);
    };
    wake();
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
    };
  }, []);
  useEffect(() => {
    const media = matchMedia("(max-width: 1200px)");
    const adapt = () => {
      if (media.matches) setInspector(false);
    };
    adapt();
    media.addEventListener("change", adapt);
    return () => media.removeEventListener("change", adapt);
  }, []);
  const groups = preview?.files.reduce<Record<string, number>>((all, item) => {
    all[item.category] = (all[item.category] || 0) + 1;
    return all;
  }, {});
  function interactWithMascot() {
    setSleeping(false);
    playSound("tap");
  }
  return (
    <MotionConfig reducedMotion="user">
      <div
        className={`app-window ${mode === "room" ? `room-shell ${roomPanel ? "" : "room-closed"}` : "classic-shell"} ${dark ? "dark" : ""} ${sidebar ? "" : "sidebar-collapsed"} ${inspector ? "" : "inspector-collapsed"} accent-${prefs.accent} time-${ambient.phase}`}
        data-phase={ambient.phase}
        style={{ "--sidebar-width": `${width}px` } as React.CSSProperties}
      >
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--surface)",
              color: "var(--ink)",
              fontSize: 14,
            },
          }}
        />
        {/* <div className="window-drag-region" data-tauri-drag-region /> */}
        <WindowControls />
        {!opening && mode === "room" && <LivingRoom ambient={ambient} busy={busy} done={done} count={files.length}
          onOpen={(target) => { setPage(target); setRoomPanel(true); }}
          onFolder={() => void chooseFolder()} onSettings={() => setSettings(true)} />}
        <button className="mode-switch" disabled={busy || opening || !mode} onClick={() => chooseMode(mode === "room" ? "classic" : "room")}>{mode === "room" ? "▤ Classic mode" : "⌂ Room mode"}</button>
        {mode === "room" && roomPanel && <button className="room-return" onClick={() => setRoomPanel(false)}>← Back to my room</button>}
        <div className="desktop-layout">
          <aside className="sidebar">
            <div className="brand">
              <NeatifyMascot
                size={66}
                portrait
                onInteract={interactWithMascot}
              />
              <div>neatify</div>
            </div>
            <div className="sidebar-label">WORKBENCH</div>
            <nav aria-label="Main navigation">
              {[
                { id: "desk", name: "My files", icon: FolderOpen },
                { id: "scheduler", name: "Scheduler", icon: CalendarDays },
                { id: "stats", name: "Activity", icon: Activity },
              ].map((item) => (
                <button
                  className={`nav-item ${page === item.id ? "active" : ""}`}
                  aria-current={page === item.id ? "page" : undefined}
                  key={item.id}
                  onClick={() => {
                    setPage(item.id);
                    if (item.id === "stats") void refresh();
                  }}
                >
                  <item.icon size={18} />
                  {item.name}
                </button>
              ))}
            </nav>
            <div className="sidebar-label places-label">QUICK ACCESS</div>
            {[
              { name: "Downloads", path: downloadDir },
              { name: "Desktop", path: desktopDir },
              { name: "Documents", path: documentDir },
              { name: "Pictures", path: pictureDir },
             
            ].map((location) => (
              <button
                className="nav-item"
                key={location.name}
                disabled={busy}
                onClick={() => void openLocation(location.path)}
              >
                <img
                  className="quick-access-icon"
                  src="/neatify.svg"
                  alt=""
                  aria-hidden="true"
                />
                {location.name}
              </button>
            ))}
            <div className="sidebar-spacer" />
            <div className="companion-card">
              <NeatifyMascot
                state={
                  busy
                    ? "organizing"
                    : scan
                      ? "scanning"
                      : error
                        ? "error"
                        : done
                          ? "success"
                          : sleeping
                            ? "sitting"
                            : "idle"
                }
                size={237}
                onInteract={interactWithMascot}
              />
            </div>
            <button
              className="nav-item settings-nav"
              onClick={() => setSettings(true)}
            >
              <Settings2 size={18} />
              Settings
            </button>

            <div
              className="sidebar-resize"
              role="separator"
              tabIndex={0}
              aria-label="Resize sidebar"
              aria-orientation="vertical"
              onKeyDown={(e) => {
                if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
                  e.preventDefault();
                  setWidth((w) =>
                    Math.max(
                      220,
                      Math.min(300, w + (e.key === "ArrowRight" ? 8 : -8)),
                    ),
                  );
                }
              }}
              onPointerDown={(e) =>
                e.currentTarget.setPointerCapture(e.pointerId)
              }
              onPointerMove={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId))
                  setWidth(Math.max(220, Math.min(300, e.clientX)));
              }}
              onPointerUp={(e) =>
                e.currentTarget.releasePointerCapture(e.pointerId)
              }
            />
          </aside>
          <main className="workspace">
            <div className="app-toolbar">
              <button
                className="icon-button"
                aria-label="Toggle sidebar"
                aria-expanded={sidebar}
                onClick={() => setSidebar(!sidebar)}
              >
                <PanelLeft size={18} />
              </button>
              <div className="toolbar-location">
                <strong>
                  {page === "desk"
                    ? "My files"
                    : page === "scheduler"
                      ? "Scheduler"
                      : "Activity"}
                </strong>
                {folder && page === "desk" && (
                  <>
                    <span title={folder}>/ {folderName(folder)}</span>
                    <button
                      className="clear-folder"
                      aria-label="Deselect folder"
                      title="Deselect folder"
                      onClick={clearFolder}
                    >
                      <X size={14} />
                    </button>
                  </>
                )}
              </div>
              <div className="toolbar-actions">
                <div className="time-capsule" title="Theme follows your local time">
                  <span className="time-orb" aria-hidden="true" />
                  <span>
                    <strong>{localTime}</strong>
                    <small>{timeCopy.label}</small>
                  </span>
                </div>
                {page === "desk" && (
                  <button
                    className="icon-button"
                    aria-label="Toggle inspector"
                    aria-expanded={inspector}
                    onClick={() => setInspector(!inspector)}
                  >
                    <PanelRight size={18} />
                  </button>
                )}
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={chooseFolder}
                >
                  <FolderOpen size={16} />
                  Open folder
                </button>
                <button
                  className="icon-button"
                  aria-label="Open settings"
                  onClick={() => setSettings(true)}
                >
                  <Settings2 size={18} />
                </button>
              </div>
            </div>
            <div className="workspace-content bg-[#eee8d2]">
              {page === "desk" ? (
                <div
                  className={`relative isolate min-h-full ${!scan && (!folder || !files.length) ? "room-stage-empty" : ""}`}
                >
                  <div className="workspace-backdrop pointer-events-none absolute right-0 top-0 z-0 w-[min(700px,76%)] opacity-[1]">
                    <AmbientScene
                      state={busy ? "organizing" : done ? "success" : "idle"}
                      onMascotClick={interactWithMascot}
                      ambient={ambient}
                    />
                  </div>
                  <div className="desk-heading relative z-[1]">
                    <div>
                      <motion.span
                        className="time-greeting"
                        key={ambient.phase}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Clock3 size={12} /> {timeCopy.greeting}
                      </motion.span>
                      <h1>{folder ? folderName(folder) : "My files"}</h1>
                      <p>A little order. A little room to breathe.</p>
                    </div>
                    {prefs.autoOrganize && (
                      <span className="count-pill">Watching new files</span>
                    )}
                  </div>
                  {!scan && (!folder || !files.length) && (
                    <div className="empty-room-content relative z-[1]">
                      <div className="empty-room-copy">
                        <span className="activity-kicker">A QUIET CORNER</span>
                        <h2>
                          {folder
                            ? "A little room to breathe."
                            : "Your room is ready."}
                        </h2>
                      
                        {!folder && (
                          <button
                            className="secondary open-empty"
                            onClick={chooseFolder}
                          >
                            <FolderOpen size={16} />
                            Choose a folder
                          </button>
                        )}
                        {folder && (
                          <button
                            className="secondary open-empty"
                            disabled={busy}
                            onClick={() => setUndo({ path: folder })}
                          >
                            <RotateCcw size={16} />
                            Undo previous tidy
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="workbench relative z-[1]">
                    <section className="file-window">
                      <div className="pane-heading">
                        <span>
                          <Folder size={16} />
                          {folder ? folderName(folder) : "Folder contents"}
                        </span>
                        <small>
                          {scan
                            ? "Reading…"
                            : `${files.length.toLocaleString()} files`}
                        </small>
                      </div>
                      <label className="file-search">
                        <Search size={17} />
                        <input
                          aria-label="Search files"
                          placeholder="Search this folder"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                        />
                      </label>
                      <div className="file-columns">
                        <span>Name</span>
                        <span>Destination</span>
                      </div>
                      {scan ? (
                        <div
                          className="skeleton-list"
                          aria-label="Reading folder"
                          role="status"
                        >
                          {Array.from({ length: 7 }, (_, i) => (
                            <div key={i} />
                          ))}
                        </div>
                      ) : files.length ? (
                        <VirtualFileList
                          items={filtered}
                          onSelect={setSelected}
                          selectedSource={selected?.source}
                        />
                      ) : (
                        <div className="file-empty">
                          <AmbientScene
                            state={
                              done ? "success" : sleeping ? "sleeping" : "empty"
                            }
                            context={
                              /document/i.test(folder)
                                ? "bookshelf"
                                : /picture/i.test(folder)
                                  ? "window"
                                  : /desktop/i.test(folder)
                                    ? "workshop"
                                    : "workspace"
                            }
                            onMascotClick={interactWithMascot}
                            ambient={ambient}
                          />
                          <h2>
                            {done
                              ? "All tucked in."
                              : folder
                                ? "A little room to breathe."
                                : "A quiet corner for your files."}
                          </h2>
                          <p>
                            {folder
                              ? "No loose files match your organization rules."
                              : "Pick a folder. We’ll help with the little mess."}
                          </p>
                          {!folder && (
                            <button
                              className="secondary open-empty"
                              onClick={chooseFolder}
                            >
                              <FolderOpen size={16} />
                              Choose a folder…
                            </button>
                          )}
                          <span className="empty-hint">
                            {folder
                              ? "Subfolders and hidden files stay untouched."
                              : "You can also drop a folder here."}
                          </span>
                        </div>
                      )}
                    </section>
                    <aside className="inspector">
                      <div className="inspector-heading">
                        <Settings2 size={17} />
                        <h2>Tidy settings</h2>
                        <button
                          className="text-button inspector-close"
                          onClick={() => setInspector(false)}
                        >
                          Close
                        </button>
                      </div>
                      {selected && (
                        <div className="selected-file">
                          <div className="flex items-center gap-2">
                            <strong>{folderName(selected.source)}</strong>
                            <button
                              className="icon-button ml-auto shrink-0"
                              aria-label="Clear selected file"
                              title="Clear selected file"
                              onClick={() => setSelected(null)}
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <p>{(selected.bytes / 1024).toFixed(1)} KB</p>
                          <p title={selected.destination}>
                            To: {selected.destination}
                          </p>
                        </div>
                      )}
                      <span className="inspector-label">ORGANIZE BY</span>
                      <div className="sort-options">
                        {[
                          {
                            id: "category",
                            name: "Smart categories",
                            detail: "Documents, Media, Code…",
                          },
                          {
                            id: "extension",
                            name: "File extension",
                            detail: "PDF, JPG, TXT…",
                          },
                        ].map((option) => (
                          <button
                            disabled={busy}
                            key={option.id}
                            aria-pressed={method === option.id}
                            className={`sort-option ${method === option.id ? "selected" : ""}`}
                            onClick={() => setMethod(option.id)}
                          >
                            <span className="radio-dot" />
                            <span>
                              <strong>{option.name}</strong>
                              <small>{option.detail}</small>
                            </span>
                          </button>
                        ))}
                      </div>
                      <div className="folder-tree">
                        <span className="inspector-label">
                          A PLACE FOR EVERYTHING
                        </span>
                        {(method === "category"
                          ? ["Documents", "Media", "Code", "Others"]
                          : ["PDF", "JPG", "TXT"]
                        ).map((name) => (
                          <div key={name}>
                            <Folder size={18} />
                            {name}
                          </div>
                        ))}
                      </div>
                      <div className="safety-note">
                        <LockKeyhole size={16} />
                        <p>
                          On your computer.
                          <br />
                          Yours to undo.
                        </p>
                      </div>
                      <div className="inspector-spacer" />
                      {busy ? (
                        <button
                          className="primary"
                          onClick={() =>
                            void command("cancel_organize").catch((e) =>
                              setError(String(e)),
                            )
                          }
                        >
                          <Square size={15} />
                          Stop organizing
                        </button>
                      ) : folder && files.length ? (
                        <div className="tidy-actions">
                          <button
                            className="primary organize-now"
                            disabled={previewLoading || scan}
                            onClick={() => void run(folder, method)}
                          >
                            <Sparkles size={16} />
                            Organize {files.length.toLocaleString()} files
                            <span className="button-glint" aria-hidden="true" />
                          </button>
                          <button
                            className="secondary preview-action"
                            disabled={previewLoading || scan}
                            onClick={showPreview}
                          >
                            <Eye size={15} />
                            {previewLoading ? "Building preview…" : "Preview every move"}
                          </button>
                        </div>
                      ) : null}
                      <button
                        className="secondary undo-button"
                        disabled={!folder || busy}
                        onClick={() => setUndo({ path: folder })}
                      >
                        <RotateCcw size={15} />
                        Undo tidies
                      </button>
                      <small className="inspector-footnote">
                        Nothing is overwritten. Every tidy can be undone.
                      </small>
                    </aside>
                  </div>
                  {!inspector && folder && files.length > 0 && (
                    <div className="collapsed-tidy tidy-actions">
                      <button
                        className="primary organize-now"
                        disabled={busy || scan || previewLoading}
                        onClick={() => void run(folder, method)}
                      >
                        <Sparkles size={16} />
                        Organize {files.length.toLocaleString()} files
                      </button>
                      <button
                        className="secondary preview-action"
                        disabled={busy || scan || previewLoading}
                        onClick={showPreview}
                      >
                        <Eye size={15} /> Preview
                      </button>
                    </div>
                  )}
                </div>
              ) : page === "scheduler" ? (
                <Scheduler
                  schedules={schedules}
                  update={updateSchedules}
                  run={(task) => run(task.folder, task.method, task)}
                  busy={busy}
                />
              ) : (
                <StatsDashboard
                  stats={stats}
                  refresh={refresh}
                  loading={statsLoading}
                  error=""
                  busy={busy}
                  onUndo={(s: Session) => setUndo({ path: s.path, id: s.id })}
                />
              )}
              {(busy || status || error) && (
                <div className="activity-status" aria-live="polite">
                  {busy && (
                    <>
                      <div className="progress-heading">
                        <span>Organizing files…</span>
                        <strong>{progress}%</strong>
                      </div>
                      <div className="progress-track">
                        <div style={{ width: `${progress}%` }} />
                      </div>
                    </>
                  )}
                  {status && <p>{status}</p>}
                  {error && (
                    <p className="error-message" role="alert">
                      {error}
                    </p>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
        {/* <footer className="app-statusbar">
          <span>
            <span className="tiny-led" />
            {busy
              ? "Organizing…"
              : prefs.autoOrganize
                ? "Watching for new files"
                : "Ready"}
          </span>
          <span>
            {desktop
              ? "Files stay on this computer"
              : "Browser preview · open the desktop app to access files"}
          </span>
          <span>{stats.organized.toLocaleString()} files organized</span>
        </footer> */}
        <AnimatePresence>
          {!opening && !mode && <ModeChooser onChoose={chooseMode} />}
          {settings && (
            <PreferencesPanel
              value={prefs}
              update={setPrefs}
              onClose={() => setSettings(false)}
              notifications={notifications}
              setNotifications={setNotifications}
              onClear={async () => {
                await command("clear_activity");
                await refresh();
              }}
            />
          )}
          {preview && (
            <Sheet
              wide
              title="Review your tidy"
              subtitle={`${preview.files.length.toLocaleString()} files in ${folderName(preview.path)}`}
              onClose={() => setPreview(null)}
            >
              <div className="preview-categories">
                {Object.entries(groups || {}).map(([name, count]) => (
                  <span key={name}>
                    <Folder size={16} />
                    {name}
                    <strong>{count}</strong>
                  </span>
                ))}
              </div>
              <div className="preview-list">
                <VirtualFileList items={preview.files} />
              </div>
              <p className="help-box">
                Only these files will move. Existing files are never
                overwritten. If files change after this preview, we’ll ask you
                to review again.
              </p>
              <footer className="sheet-footer">
                <button className="secondary" onClick={() => setPreview(null)}>
                  Cancel
                </button>
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() => {
                    const reviewed = preview;
                    setPreview(null);
                    void run(
                      reviewed.path,
                      reviewed.method,
                      undefined,
                      reviewed.files,
                    );
                  }}
                >
                  Organize {preview.files.length.toLocaleString()} files
                  <ArrowRight size={16} />
                </button>
              </footer>
            </Sheet>
          )}
          {undo && (
            <Sheet
              title="Restore these files?"
              subtitle={`Restore recorded moves in ${folderName(undo.path)}. Existing files will not be overwritten.`}
              onClose={() => setUndo(null)}
            >
              <footer className="sheet-footer">
                <button className="secondary" onClick={() => setUndo(null)}>
                  Cancel
                </button>
                <button className="primary" onClick={restore}>
                  <RotateCcw size={16} />
                  Restore files
                </button>
              </footer>
            </Sheet>
          )}
        </AnimatePresence>
        {dragging && (
          <div className="drop-overlay">
            <FolderOpen size={32} />
            <strong>Drop a folder or files from one folder</strong>
            <span>Review the moves before organizing.</span>
          </div>
        )}
        {opening && <Opening />}
      </div>
    </MotionConfig>
  );
}
