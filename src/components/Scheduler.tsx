import { useState } from "react";
import {
  CalendarDays,
  Clock3,
  FolderOpen,
  Pause,
  Play,
  Plus,
  Pencil,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import Sheet from "./Sheet";
import {
  Schedule,
  presets,
  nextRun,
  pickFolder,
  folderName,
  friendlyDate,
} from "../lib/workspace";

export default function Scheduler({
  schedules,
  update,
  run,
  busy,
}: {
  schedules: Schedule[];
  update: (items: Schedule[]) => void;
  run: (task: Schedule) => Promise<void>;
  busy: boolean;
}) {
  const [draft, setDraft] = useState<Schedule | null>(null);
  const [error, setError] = useState("");
  const [remove, setRemove] = useState<Schedule | null>(null);
  const [help, setHelp] = useState(false);
  const create = () => {
    setError("");
    setDraft({
      id: crypto.randomUUID(),
      name: "",
      folder: "",
      cron: presets[2].cron,
      method: "category",
      enabled: true,
      nextRun: "",
    });
  };
  let next = "";
  try {
    if (draft) next = friendlyDate(nextRun(draft.cron));
  } catch {
    /* Inline validation on submit. */
  }
  function save() {
    if (!draft) return;
    if (!draft.name.trim() || !draft.folder.trim()) {
      setError("Give your tidy a name and choose a folder.");
      return;
    }
    try {
      const task = {
        ...draft,
        name: draft.name.trim(),
        folder: draft.folder.trim(),
        nextRun: nextRun(draft.cron),
      };
      update(
        schedules.some((s) => s.id === task.id)
          ? schedules.map((s) => (s.id === task.id ? task : s))
          : [...schedules, task],
      );
      setDraft(null);
    } catch (e) {
      setError(String(e));
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">AUTOMATION</div>
          <h1>Scheduled tidies</h1>
          <p>Your folders, on a regular rhythm.</p>
        </div>
        <button className="primary" onClick={create}>
          <Plus size={17} /> New schedule
        </button>
      </div>
      <div className="info-strip">
        <Clock3 size={17} />
        <span>
          Schedules run while Neatify is open and your computer is awake. Times
          are local.
        </span>
        <span className="count-pill">{schedules.length} tasks</span>
      </div>
      {schedules.length === 0 ? (
        <div className="empty-state">
          <div className="empty-art">
            <CalendarDays size={42} />
            <span>✦</span>
          </div>
          <h2>No routines just yet.</h2>
          <p>
            Give your Downloads folder a fresh start every morning.
            <br />
            Or pick a rhythm that feels like you.
          </p>
          <button className="primary" onClick={create}>
            <Plus size={17} /> Create your first schedule
          </button>
          <small>You choose the folder. We keep it in order.</small>
        </div>
      ) : (
        <div className="schedule-list">
          {schedules.map((task) => (
            <article className="schedule-card" key={task.id}>
              <div className={`schedule-icon ${task.enabled ? "" : "paused"}`}>
                <CalendarDays size={23} />
              </div>
              <div className="schedule-details">
                <h3>
                  {task.name}
                  <span
                    className={`status-pill ${task.enabled ? "" : "paused"}`}
                  >
                    {task.enabled ? "Active" : "Paused"}
                  </span>
                </h3>
                <p title={task.folder}>
                  <FolderOpen size={13} />
                  {task.folder}
                </p>
                <div className="schedule-meta">
                  {task.enabled
                    ? `Next: ${friendlyDate(task.nextRun)}`
                    : "Taking a breather"}{" "}
                  ·{" "}
                  {presets.find((p) => p.cron === task.cron)?.name || task.cron}
                </div>
                {task.result && (
                  <small className="last-result">
                    {task.lastRun && friendlyDate(task.lastRun)} · {task.result}
                  </small>
                )}
              </div>
              <div className="schedule-actions">
                <button
                  className="icon-button"
                  title="Run now"
                  aria-label={`Run ${task.name} now`}
                  disabled={busy}
                  onClick={() => run(task)}
                >
                  <Play size={16} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`${task.enabled ? "Pause" : "Resume"} ${task.name}`}
                  onClick={() =>
                    update(
                      schedules.map((s) =>
                        s.id === task.id
                          ? {
                              ...s,
                              enabled: !s.enabled,
                              nextRun: nextRun(s.cron),
                            }
                          : s,
                      ),
                    )
                  }
                >
                  {task.enabled ? <Pause size={16} /> : <Clock3 size={16} />}
                </button>
                <button
                  className="icon-button"
                  aria-label={`Edit ${task.name}`}
                  onClick={() => {
                    setError("");
                    setDraft({ ...task });
                  }}
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="icon-button danger"
                  aria-label={`Delete ${task.name}`}
                  onClick={() => setRemove(task)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <AnimatePresence>
        {draft && (
          <Sheet
            wide
            title={
              schedules.some((s) => s.id === draft.id)
                ? "Edit your schedule"
                : "New schedule"
            }
            subtitle="A calmer folder starts here."
            onClose={() => setDraft(null)}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
            >
              <label className="field">
                Task name
                <input
                  autoComplete="off"
                  maxLength={80}
                  placeholder="My morning Downloads tidy"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </label>
              <label className="field">
                Folder to organize
                <div className="input-with-button">
                  <input
                    placeholder="Choose a folder or enter its full path"
                    value={draft.folder}
                    onChange={(e) =>
                      setDraft({ ...draft, folder: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Browse for schedule folder"
                    onClick={async () => {
                      try {
                        const folder = await pickFolder();
                        if (folder)
                          setDraft({
                            ...draft,
                            folder,
                            name: draft.name || `Tidy ${folderName(folder)}`,
                          });
                      } catch (e) {
                        setError(String(e));
                      }
                    }}
                  >
                    <FolderOpen size={19} />
                  </button>
                </div>
              </label>
              <label className="field">
                Sorting style
                <select
                  value={draft.method}
                  onChange={(e) =>
                    setDraft({ ...draft, method: e.target.value })
                  }
                >
                  <option value="category">
                    Smart categories · Documents, Media, Code…
                  </option>
                  <option value="extension">
                    File extension · PDF, JPG, TXT…
                  </option>
                </select>
              </label>
              <div className="field-label">Choose your rhythm</div>
              <div className="preset-grid">
                {presets.map((p) => (
                  <button
                    type="button"
                    aria-pressed={draft.cron === p.cron}
                    className={`preset ${draft.cron === p.cron ? "selected" : ""}`}
                    key={p.cron}
                    onClick={() => setDraft({ ...draft, cron: p.cron })}
                  >
                    <strong>{p.name}</strong>
                    <small>{p.detail}</small>
                    <span className="radio-dot" />
                  </button>
                ))}
              </div>
              <label className="field cron-field">
                Custom schedule (cron)
                <input
                  spellCheck={false}
                  value={draft.cron}
                  onChange={(e) => setDraft({ ...draft, cron: e.target.value })}
                />
              </label>
              <div className="field-help">
                <span>second · minute · hour · day · month · weekday</span>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setHelp(!help)}
                >
                  Cron help
                </button>
              </div>
              {help && (
                <p className="help-box">
                  Use * for any value, */15 for every 15, 1-5 for a range, and
                  1,3 for a list. Weekdays: 0 is Sunday. Example: 0 30 18 * *
                  1-5 runs weekdays at 6:30 PM.
                </p>
              )}
              <div className="next-preview">
                <Clock3 size={16} />
                {next
                  ? `First tidy: ${next}`
                  : "Enter a valid schedule to see the next run."}
              </div>
              {error && (
                <p role="alert" className="error-message">
                  {error}
                </p>
              )}
              <footer className="sheet-footer">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setDraft(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary">
                  Save schedule <ArrowRight size={16} />
                </button>
              </footer>
            </form>
          </Sheet>
        )}
        {remove && (
          <Sheet
            title="Remove this routine?"
            subtitle={`“${remove.name}” will no longer run. Your files stay where they are.`}
            onClose={() => setRemove(null)}
          >
            <div className="sheet-footer">
              <button className="secondary" onClick={() => setRemove(null)}>
                Keep schedule
              </button>
              <button
                className="primary destructive"
                onClick={() => {
                  update(schedules.filter((s) => s.id !== remove.id));
                  setRemove(null);
                }}
              >
                Delete schedule
              </button>
            </div>
          </Sheet>
        )}
      </AnimatePresence>
    </>
  );
}
