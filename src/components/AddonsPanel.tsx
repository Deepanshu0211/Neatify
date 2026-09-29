import { Bell, Coffee, Gamepad2, Moon, Sun, ArrowUpRight } from "lucide-react";
import { open } from "@tauri-apps/plugin-shell";
import Sheet from "./Sheet";
import NeatifyMascot from "./NeatifyMascot";
import { desktop, setting } from "../lib/workspace";
export { setting as readSetting };
type Props = {
  onClose: () => void;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  notifications: boolean;
  setNotifications: (value: boolean) => void;
  discordRpc: boolean;
  setDiscordRpc: (value: boolean) => void;
  rpcBusy: boolean;
};
export default function AddonsPanel(props: Props) {
  return (
    <Sheet
      title="Preferences"
      subtitle="A few things to make this space your own."
      onClose={props.onClose}
    >
      <div className="settings-section">PERSONALIZE YOUR SPACE</div>
      <div className="setting-row">
        <div className="setting-icon lilac">
          {props.darkMode ? <Moon size={21} /> : <Sun size={21} />}
        </div>
        <div>
          <strong>Dark appearance</strong>
          <p>A softer glow after hours</p>
        </div>
        <button
          role="switch"
          aria-label="Dark appearance"
          aria-checked={props.darkMode}
          className={`switch ${props.darkMode ? "on" : ""}`}
          onClick={() => props.setDarkMode(!props.darkMode)}
        >
          <span />
        </button>
      </div>
      <div className="setting-row">
        <div className="setting-icon mint">
          <Bell size={21} />
        </div>
        <div>
          <strong>Notifications</strong>
          <p>In-app updates when a tidy finishes</p>
        </div>
        <button
          role="switch"
          aria-label="Notifications"
          aria-checked={props.notifications}
          className={`switch ${props.notifications ? "on" : ""}`}
          onClick={() => props.setNotifications(!props.notifications)}
        >
          <span />
        </button>
      </div>
      <div className="setting-row">
        <div className="setting-icon blue">
          <Gamepad2 size={21} />
        </div>
        <div>
          <strong>Discord presence</strong>
          <p>Share your tidy time on Discord</p>
        </div>
        <button
          role="switch"
          disabled={props.rpcBusy}
          aria-label="Discord presence"
          aria-checked={props.discordRpc}
          className={`switch ${props.discordRpc ? "on" : ""}`}
          onClick={() => props.setDiscordRpc(!props.discordRpc)}
        >
          <span />
        </button>
      </div>
      <div className="maker-note">
        <NeatifyMascot size={48} />
        <div>
          <strong>Made with a little extra care.</strong>
          <p>By Deepanshu · for beautifully ordinary days</p>
        </div>
      </div>
      <a
        className="coffee-link"
        href="https://www.buymeacoffee.com/deepsomnia"
        target="_blank"
        rel="noreferrer"
        onClick={(e) => {
          if (desktop) {
            e.preventDefault();
            void open(e.currentTarget.href);
          }
        }}
      >
        <Coffee size={18} /> Buy me a coffee <ArrowUpRight size={16} />
      </a>
    </Sheet>
  );
}
