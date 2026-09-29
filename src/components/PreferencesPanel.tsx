import { useEffect, useState } from "react";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";
import { save } from "@tauri-apps/plugin-dialog";
import Sheet from "./Sheet";
import { Preferences, defaults } from "../lib/preferences";
import { command, desktop, setting } from "../lib/workspace";
export default function PreferencesPanel({
  value,
  update,
  onClose,
  onClear,
  notifications,
  setNotifications,
}: {
  value: Preferences;
  update: (p: Preferences) => void;
  onClose: () => void;
  onClear: () => Promise<void>;
  notifications: boolean;
  setNotifications: (v: boolean) => void;
}) {
  const [rpc, setRpc] = useState(() => setting("neatify-discord", false));
  const [rpcStatus, setRpcStatus] = useState(() =>
    setting("neatify-discord", false) ? "Connecting…" : "Off",
  );
  const [startup, setStartup] = useState(false),
    [error, setError] = useState(""),
    [pending, setPending] = useState(false),
    [confirm, setConfirm] = useState(false);
  useEffect(() => {
    if (desktop)
      void isEnabled()
        .then(setStartup)
        .catch((e) => setError(String(e)));
  }, []);
  const patch = (p: Partial<Preferences>) => update({ ...value, ...p });
  async function nativeChange(action: () => Promise<void>) {
    setPending(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError(String(e));
    } finally {
      setPending(false);
    }
  }
  async function changeDiscord(checked: boolean) {
    setPending(true);
    setError("");
    setRpcStatus(checked ? "Connecting…" : "Turning off…");
    try {
      await command("set_discord_presence", { enabled: checked });
      setRpc(checked);
      setRpcStatus(checked ? "Connected" : "Off");
      localStorage.setItem("neatify-discord", String(checked));
    } catch (e) {
      setRpcStatus("Unavailable");
      setError(String(e));
    } finally {
      setPending(false);
    }
  }
  useEffect(() => {
    if (!desktop || !rpc) return;
    void changeDiscord(true);
  }, []);
  return (
    <Sheet
      wide
      className="settings-sheet"
      title="Settings"
      subtitle="Make yourself at home."
      onClose={onClose}
    >
      <div className="preferences-grid">
        <section>
          <h3>Appearance</h3>
          <p className="section-intro">
            Choose how Neatify should feel while you make room.
          </p>
          <label className="field">
            Theme
            <select
              value={value.theme}
              onChange={(e) =>
                patch({ theme: e.target.value as Preferences["theme"] })
              }
            >
              <option value="system">Follow Windows</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label className="field">
            Accent
            <select
              value={value.accent}
              onChange={(e) =>
                patch({ accent: e.target.value as Preferences["accent"] })
              }
            >
              <option value="sage">Sage</option>
              <option value="olive">Olive</option>
            </select>
          </label>
        </section>
        <section>
          <h3>Behavior</h3>
          <p className="section-intro">
            Small helpers that keep your tidying routine comfortable.
          </p>
          <label className="check-row">
            <input
              type="checkbox"
              disabled={!desktop || pending}
              checked={startup}
              onChange={(e) => {
                const checked = e.target.checked;
                void nativeChange(async () => {
                  await (checked ? enable() : disable());
                  setStartup(checked);
                });
              }}
            />
            Start with Windows
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              disabled={!desktop || pending}
              checked={value.tray}
              onChange={(e) => {
                const checked = e.target.checked;
                void nativeChange(async () => {
                  await command("set_tray_preference", { enabled: checked });
                  patch({ tray: checked });
                });
              }}
            />
            Keep running in the system tray
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
            />
            Show completion messages
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={value.sound}
              onChange={(e) => patch({ sound: e.target.checked })}
            />
            Sound effects
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={value.autoOrganize}
              onChange={(e) => patch({ autoOrganize: e.target.checked })}
            />
            Automatically organize new files
          </label>
          <p className="setting-help">
            Watches the open folder while Neatify is running. New files must
            stay unchanged across two 10-second checks. Existing files still use
            Preview tidy.
          </p>
        </section>
        <section>
          <h3>Organization rules</h3>
          <p className="section-intro">
            Tell Neatify what belongs together and what should stay untouched.
          </p>
          <label className="field">
            Custom categories
            <textarea
              value={value.extensions}
              onChange={(e) => patch({ extensions: e.target.value })}
              placeholder={"pdf=Documents/PDF\npsd=Design"}
              rows={3}
            />
            <small>One extension=relative folder per line.</small>
          </label>
          <label className="field">
            Excluded extensions
            <input
              value={value.excludedExtensions}
              onChange={(e) => patch({ excludedExtensions: e.target.value })}
              placeholder="tmp, log, part"
            />
          </label>
          <label className="field">
            Excluded folders
            <textarea
              value={value.excludedFolders}
              onChange={(e) => patch({ excludedFolders: e.target.value })}
              rows={2}
              placeholder="One full folder path per line"
            />
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={value.skipDuplicates}
              onChange={(e) => patch({ skipDuplicates: e.target.checked })}
            />
            Skip files whose destination name exists
          </label>
        </section>
        <section>
          <h3>Privacy & history</h3>
          <p className="section-intro">
            Your files stay local. You decide what Neatify remembers and shares.
          </p>
          <label className="check-row">
            <input
              type="checkbox"
              disabled={!desktop || pending}
              checked={rpc}
              onChange={(e) => {
                void changeDiscord(e.target.checked);
              }}
            />
            Show Neatify in Discord
          </label>
          <p className="setting-status" data-state={rpcStatus.toLowerCase()}>
            <span />
            {desktop ? `Discord: ${rpcStatus}` : "Desktop app required"}
          </p>
          <p className="setting-help">
            {desktop
              ? "Discord must be open. Neatify will show your current tidy state."
              : "Open the desktop app with Discord running to enable this."}
          </p>
          <label className="check-row">
            <input
              type="checkbox"
              checked={value.privateHistory}
              onChange={(e) => patch({ privateHistory: e.target.checked })}
            />
            Do not record new activity details
          </label>
          <p className="setting-help">
            Undo records remain inside organized folders so moves can still be
            restored.
          </p>
          <button
            className="secondary"
            disabled={!desktop || pending}
            onClick={() => setConfirm(true)}
          >
            Clear activity history…
          </button>
          {confirm && (
            <div className="help-box">
              <p>Clear saved totals and activity? Undo records are kept.</p>
              <button className="secondary" onClick={() => setConfirm(false)}>
                Cancel
              </button>
              <button
                className="secondary danger"
                onClick={() =>
                  void nativeChange(async () => {
                    await onClear();
                    setConfirm(false);
                  })
                }
              >
                Clear history
              </button>
            </div>
          )}
          <button
            className="text-button"
            disabled={!desktop || pending}
            onClick={() =>
              void nativeChange(async () => {
                const path = await save({
                  title: "Export Neatify activity",
                  defaultPath: "neatify-activity.json",
                  filters: [
                    { name: "JSON activity log", extensions: ["json"] },
                  ],
                });
                if (path) await command("export_activity", { path });
              })
            }
          >
            Export activity log…
          </button>
          <button
            className="text-button"
            disabled={pending}
            onClick={() =>
              void nativeChange(async () => {
                if (desktop) {
                  await disable();
                  await command("set_tray_preference", { enabled: false });
                }
                setStartup(false);
                setRpc(false);
                setRpcStatus("Off");
                localStorage.setItem("neatify-discord", "false");
                update(defaults);
                setNotifications(true);
              })
            }
          >
            Reset preferences
          </button>
        </section>
      </div>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
    </Sheet>
  );
}
