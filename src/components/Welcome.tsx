import NeatifyMascot from "./NeatifyMascot";
import Sheet from "./Sheet";
import "./Welcome.css";

export type AppMode = "classic" | "room";
export function Opening() {
  return <div className="opening-screen" role="status" aria-label="Opening Neatify">
    <div className="opening-vignette" aria-hidden="true"><div className="opening-window">✦</div><div className="opening-desk"/><div className="opening-lamp"/><div className="opening-mascot"><NeatifyMascot state="carrying" size={112}/></div><span className="opening-folder">▰</span></div>
    <h1>neatify</h1><p>Putting the kettle on…</p>
    <div className="opening-track"><span/></div><small>YOUR FILES. A LITTLE MORE AT HOME.</small>
  </div>;
}
export function ModeChooser({ onChoose }: { onChoose: (mode: AppMode) => void }) {
  return <Sheet title="How do you like to work?" subtitle="Same files, two ways to feel at home. You can switch whenever you like." onClose={() => onChoose("classic")}>
    <div className="mode-choices">
      <button onClick={() => onChoose("classic")}><span aria-hidden="true">▤</span><strong>Classic workspace</strong><p>Folders, lists, and familiar controls. Straight to the task.</p></button>
      <button onClick={() => onChoose("room")}><span aria-hidden="true">⌂</span><strong>Pip’s room</strong><p>A desk to work at. A lamp to switch on. A small friend to keep you company.</p></button>
    </div>
  </Sheet>;
}
