import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FolderOpen,
  RefreshCw,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Stats, Session, folderName, friendlyDate } from "../lib/workspace";
import NeatifyMascot from "./NeatifyMascot";
export default function StatsDashboard({
  stats,
  refresh,
  loading,
  error,
  onUndo,
  busy,
}: {
  stats: Stats;
  refresh: () => void;
  loading: boolean;
  error: string;
  onUndo?: (session: Session) => void;
  busy?: boolean;
}) {
  const events = stats.events || [];
  const successRate = stats.sessions
    ? Math.max(
        0,
        Math.round(((stats.sessions - stats.failed) / stats.sessions) * 100),
      )
    : 100;
  const categoryCount = Object.keys(stats.categories || {}).length;
  const latestSession = events[0];
  return (
    <div className="activity-page">
      <div className="activity-hero flex flex-wrap items-end justify-between gap-5">
        <div>
          <span className="activity-kicker">
            HOUSE LOG / {stats.sessions} VISITS
          </span>
          <h1 className="mt-2">Activity</h1>
          <p>Every tidy, saved locally and easy to undo.</p>
        </div>
        <button className="secondary" disabled={loading} onClick={refresh}>
          <RefreshCw className={loading ? "spin" : ""} size={16} />
          Refresh log
        </button>
      </div>
      {error && <p className="error-message">{error}</p>}
      <div className="activity-summary grid gap-3 md:grid-cols-3">
        <article className="activity-stat activity-stat-green">
          <CheckCircle2 size={20} />
          <strong>{stats.organized.toLocaleString()}</strong>
          <span>files settled into place</span>
        </article>
        <article className="activity-stat activity-stat-gold">
          <Clock3 size={20} />
          <strong>{stats.sessions}</strong>
          <span>tidy sessions completed</span>
        </article>
        <article className="activity-stat activity-stat-blue">
          <Sparkles size={20} />
          <strong>{successRate}%</strong>
          <span>
            {stats.failed
              ? `${stats.failed} moves need attention`
              : "smooth sailing so far"}
          </span>
        </article>
      </div>
      <div className="activity-layout grid gap-4 xl:grid-cols-[minmax(0,1fr)_250px]">
        <section className="activity-feed-panel">
          <div className="activity-panel-heading flex items-center justify-between gap-4">
            <div>
              <span className="activity-kicker">RECENT MOVEMENTS</span>
              <h2>What happened around here</h2>
            </div>
            <span className="activity-count">{events.length} entries</span>
          </div>
          <div className="timeline">
            {!events.length ? (
              <div className="activity-empty">
                <NeatifyMascot size={92} />
                <div>
                  <h3>A fresh page.</h3>
                  <p>Your next tidy will make the first mark.</p>
                </div>
              </div>
            ) : (
              events.map((session) => (
                <article className="session" key={session.id}>
                  <div className="session-marker">
                    {session.kind === "undo" ? (
                      <RotateCcw size={14} />
                    ) : (
                      <FolderOpen size={14} />
                    )}
                  </div>
                  <div className="session-content">
                    <div className="session-heading">
                      <div>
                        <h3>
                          {session.kind === "undo"
                            ? "Restored files"
                            : "Organized " + folderName(session.path)}
                        </h3>
                        <p>
                          {friendlyDate(session.timestamp)} ·{" "}
                          {session.organized} files
                          {session.failed > 0
                            ? ` · ${session.failed} failed`
                            : ""}
                          {session.cancelled ? " · stopped" : ""}
                        </p>
                      </div>
                      {session.kind !== "undo" && session.organized > 0 && (
                        <button
                          className="secondary"
                          disabled={busy || session.undone}
                          onClick={() => onUndo?.(session)}
                        >
                          <RotateCcw size={15} />
                          {session.undone ? "Restored" : "Undo"}
                        </button>
                      )}
                    </div>
                    <details>
                      <summary>View details</summary>
                      <p className="session-path">{session.path}</p>
                      <div className="category-chips">
                        {Object.entries(session.categories).map(
                          ([name, count]) => (
                            <span key={name}>
                              {name} <strong>{count}</strong>
                            </span>
                          ),
                        )}
                      </div>
                      {session.errors.map((failure, i) => (
                        <p className="error-message" key={i}>
                          <strong>{failure.path}</strong>
                          <br />
                          {failure.reason}
                        </p>
                      ))}
                    </details>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
        <aside className="activity-aside">
          <div className="activity-companion">
            <NeatifyMascot
              size={112}
              state={stats.failed ? "confused" : "happy"}
            />
            <span className="activity-kicker">ROOM STATUS</span>
            <h2>
              {stats.failed
                ? "A few things need you."
                : "Everything feels lighter."}
            </h2>
            <p>
              {latestSession
                ? `Last visit ${friendlyDate(latestSession.timestamp)}.`
                : "Choose a folder and your companion will keep the log."}
            </p>
          </div>
          <div className="activity-fact-list">
            <div>
              <span>Categories used</span>
              <strong>{categoryCount}</strong>
            </div>
            <div>
              <span>Failed moves</span>
              <strong>{stats.failed}</strong>
            </div>
            <div>
              <span>Undo actions</span>
              <strong>{stats.undo_count}</strong>
            </div>
          </div>
          {stats.failed > 0 && (
            <div className="activity-alert">
              <AlertTriangle size={16} />
              <span>Review failed moves in the latest entries.</span>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
