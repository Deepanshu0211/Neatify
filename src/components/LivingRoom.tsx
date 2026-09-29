import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { AmbientState } from "../lib/useAmbientState";
import NeatifyMascot from "./NeatifyMascot";
import Sheet from "./Sheet";
import "./LivingRoom.css";

const lessons = [
  ["Welcome home", "This is your workspace. Hover over an object to find its name, or use Tab and Enter to explore.", ""],
  ["Your desk computer", "Click the monitor to open your files. Bring a folder, preview the moves, then organize. Undo is there if you change your mind.", "computer"],
  ["Leave a note for later", "The wall calendar opens routines. Schedule a tidy while Neatify is running; the books above the desk hold your activity journal.", "calendar"],
  ["The little drawers", "Open the drawers for sorting rules, sound, and other preferences. Classic mode is always available at the top of the app.", "drawers"],
  ["Make it comfortable", "Click the lamp to turn its light on or off. Water Fern on the left, or click the tea mug to give Pip a break.", "lamp"],
  ["Meet Pip", "Click Pip for a head pat. He wanders when you’re idle and carries files while you organize. He has opinions about tea.", "pip"],
  ["A window on your day", "The clock follows your device. Weather updates every 15 minutes when location and internet are available. If it cannot connect, we’ll say so.", ""],
  ["Your own corner", "Choose Woodland, Rose, or Seaside below. Your choice is saved. Replay this tour any time using Room guide.", ""],
];

export default function LivingRoom({ ambient, busy, done, count, onOpen, onFolder, onSettings }: {
  ambient: AmbientState; busy: boolean; done: boolean; count: number;
  onOpen: (page: string) => void; onFolder: () => void; onSettings: () => void;
}) {
  const reduced = useReducedMotion();
  const [theme, setTheme] = useState(() => localStorage.getItem("neatify-room") || "woodland");
  const [lamp, setLamp] = useState(() => localStorage.getItem("neatify-room-lamp") !== "off");
  const [tour, setTour] = useState<number | null>(() => localStorage.getItem("neatify-room-tour") === "done" ? null : 0);
  useEffect(() => { localStorage.setItem("neatify-room-lamp", lamp ? "on" : "off"); }, [lamp]);
  function closeTour() { localStorage.setItem("neatify-room-tour", "done"); setTour(null); }
  const [position, setPosition] = useState(56);
  const [mood, setMood] = useState<"idle" | "happy" | "sleepy">("idle");
  const [walking, setWalking] = useState(false);
  const [direction, setDirection] = useState(1);
  function walkTo(next: number) {
    setDirection(next >= position ? 1 : -1);
    setPosition(next);
    setWalking(!reduced);
  }
  useEffect(() => {
    if (!walking) return;
    const timer = setTimeout(() => setWalking(false), 3000);
    return () => clearTimeout(timer);
  }, [walking, position]);
  useEffect(() => {
    if (mood === "idle") return;
    const timer = setTimeout(() => setMood("idle"), 7000);
    return () => clearTimeout(timer);
  }, [mood]);
  const [speech, setSpeech] = useState("Hi, I’m Pip. A home for every file. A little tea for me.");
  const [pets, setPets] = useState(0);
  const [watered, setWatered] = useState(false);
  useEffect(() => { localStorage.setItem("neatify-room", theme); }, [theme]);
  useEffect(() => {
    if (busy || reduced || tour !== null) return;
    const timer = setInterval(() => walkTo(position > 55 ? 37 : 68), 14000);
    return () => clearInterval(timer);
  }, [busy, reduced, tour, position]);
  const night = ["night", "dusk", "dawn"].includes(ambient.phase);
  function pet() {
    setPets(n => n + 1); setMood("happy");
    setSpeech(["Oh! A head pat. This is excellent management.", "I collect tidy folders and compliments. Mostly compliments.", "You + me + a slightly less chaotic Downloads folder."][pets % 3]);
  }
  return <section className={`living-room room-${theme} phase-${ambient.phase} ${night ? "room-after-dark" : ""} ${lamp ? "lamp-on" : ""} tour-${tour === null ? "none" : lessons[tour][2]}`} aria-label="Your interactive pixel room">
    <div className="room-weather" title={ambient.weatherUpdated ? `Last checked ${new Date(ambient.weatherUpdated).toLocaleTimeString()}. Weather supplied by Open-Meteo.` : "Weather requires location permission and an internet connection."}>{ambient.weatherStatus === "live" ? `${ambient.temperature}°C · ${ambient.weather.split("_").join(" ")}` : ambient.weatherStatus === "loading" ? "Checking the weather…" : "Weather unavailable · time stays synced"}</div>
    <header className="room-hud"><div><span className="room-wordmark">neatify<span>✦</span></span><small>A LITTLE SPACE OF YOUR OWN</small></div><div className="room-clock"><span className="live-dot" />{new Date().toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}<small>{ambient.phase} · local time</small></div></header>
    <div className="room-world">
      <svg className="room-art" viewBox="0 0 960 600" shapeRendering="crispEdges" aria-hidden="true">
        <defs><pattern id="living-wall" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="var(--room-wall)"/><path d="M11 4h2v2h-2M11 18h2v2h-2" fill="var(--room-dots)"/></pattern><pattern id="living-floor" width="120" height="36" patternUnits="userSpaceOnUse"><rect width="120" height="36" fill="var(--room-floor)"/><path d="M0 0h120M0 1v35M59 18h32" stroke="var(--room-wood)" opacity=".45"/></pattern></defs>
        <path d="M40 40H920V410H40Z" fill="url(#living-wall)"/><path d="M40 410H920V568H40Z" fill="url(#living-floor)"/>
        <path d="M28 32H932V44H28M28 44H40V568H28M920 44H932V568H920M28 568H932V580H28M40 401H920V414H40" fill="var(--room-outline)"/>
        <path d="M46 46H914V54H46" fill="var(--room-highlight)" opacity=".5"/>
        <rect x="105" y="100" width="240" height="214" fill="var(--room-outline)"/><rect x="117" y="112" width="216" height="184" fill={night ? "#283c5c" : "#9fc7be"}/>
        {night ? <g fill="#eee0aa"><path d="M280 136h20v20h-20zM286 130h14v8h-14z"/>{[0,1,2,3,4,5].map(i => <rect className="room-star" key={i} x={132+i*31} y={129+(i%3)*22} width="3" height="3" style={{animationDelay:`${i}s`}}/>)}</g> : <rect x="278" y="133" width="27" height="27" fill="#ffe5a0"/>}
        <g className="room-cloud" fill="#dce2cf" opacity=".65"><path d="M144 155h52v10h-68v-5h16zM247 180h45v9h-56v-5h11z"/></g>
        <path d="M117 255l34-34 28 15 37-44 33 47 38-22 46 38v41H117" fill="var(--room-leaf)"/><path d="M117 279l60-24 39 21 45-18 72 22v16H117" fill="#476b59"/>
        {theme === "ocean" && <g><path d="M117 235h216v61H117z" fill="#658f9b"/><path className="room-cloud" d="M125 251h60m30 14h83m-156 14h80" stroke="#b5c9bd" strokeWidth="3"/><path d="M262 200v51h-3v-51m-3 3-22 34h22m9-27 19 27h-19" fill="#eee0b7" stroke="#eee0b7"/></g>}
        {theme === "rose" && <g fill="#827887"><path d="M117 252h22v-23h36v67h-58m68-50h40v50h-40m51-77h34v77h-34m43-34h20v34h-20"/><path d="M126 242h5v7h-5m20-7h5v7h-5m98-10h5v7h-5" fill="#e7c497"/></g>}
        {ambient.weatherStatus === "live" && <svg x="117" y="112" width="216" height="184" viewBox="0 0 216 184" overflow="hidden">
          {["cloudy", "partly_cloudy", "foggy"].includes(ambient.weather) && <path d="M0 40h216v28H0M0 100h216v14H0" fill="#bcc8cf" opacity=".35"/>}
          {["rain", "heavy_rain", "drizzle", "thunderstorm", "snow"].includes(ambient.weather) && Array.from({length:18}, (_, i) => <rect key={i} className="window-precipitation" x={(i*37)%216} y={(i*29)%184} width={ambient.weather === "snow" ? 3 : 1} height={ambient.weather === "snow" ? 3 : 10} fill="#d4e1e5" style={{animationDelay:`-${i*.23}s`}}/>)}
        </svg>}
        <path d="M221 112h8v184h-8M117 201h216v8H117M95 299h260v14H95" fill="var(--room-wood)"/>
        <path d="M88 88h32v172h-9v17H88M327 88h34v189h-23v-17h-11" fill="var(--room-fabric)"/><path d="M94 99h7v151h-7M343 99h7v151h-7" fill="var(--room-outline)" opacity=".2"/>
        <path d="M432 138H699v13H432M445 151h8v15h-8M679 151h8v15h-8" fill="var(--room-wood)"/>
        {[0,1,2,3,4].map(i => <g key={i}><rect x={454+i*23} y={91+(i%2)*9} width="18" height={47-(i%2)*9} fill={["#7e9777","#b77c60","#d4b879","#829c9d","#b19296"][i]}/><rect x={458+i*23} y="119" width="10" height="3" fill="#e8dab2"/></g>)}
        <path d="M638 108h34v30h-34" fill="#b98262"/><path d="M651 77h7v34h-7M631 87h21v12h-21M658 72h17v15h-17" fill="var(--room-leaf)"/>
        <rect x="763" y="105" width="91" height="105" fill="var(--room-wood)"/><rect x="770" y="112" width="77" height="91" fill="#f0dfb4"/><path d="M779 131h59v5h-59M784 151h9v9h-9m17-9h9v9h-9m17-9h9v9h-9m-43 19h9v9h-9m17-9h9v9h-9m17-9h9v9h-9" fill="#b9876b"/>
        <path d="M375 349H802v19H375M391 368h17v122h-17M770 368h17v122h-17" fill="var(--room-wood)"/><path d="M375 345H802v7H375" fill="var(--room-highlight)"/>
        <rect x="472" y="238" width="171" height="100" fill="var(--room-outline)"/><rect x="481" y="247" width="153" height="77" fill="#344f4d"/>
        <g fill="#a9c2a0"><path d="M496 264h21v6h-21M496 277h112v3H496M496 287h81v3h-81M496 297h95v3h-95"/><rect className="monitor-cursor" x="579" y="296" width="5" height="6"/></g>
        <path d="M545 338h25v7h-25M525 343h66v5h-66M493 352h132v5H493" fill="var(--room-outline)"/>
        <path d="M697 274h7v66h-7M679 339h45v6h-45M681 251h38v8h8v24h-54v-24h8" fill="var(--room-leaf)"/>
        {lamp && <g><path className="lamp-light" d="M676 284h48l28 60H645z" fill="#f2d28a" opacity=".38"/><path d="M679 280h42v5h-42" fill="#ffe4a1"/></g>}
        <path d="M418 321h23v23h-23M441 326h9v12h-9" fill="#e8d8ac"/><path className="room-steam" d="M424 313v-10h6v-9" stroke="#e8dab4" strokeWidth="3" fill="none"/>
        <rect x="804" y="341" width="73" height="116" fill="var(--room-wood)"/>{[0,1,2].map(i => <g key={i}><rect x="811" y={349+i*33} width="59" height="27" fill="var(--room-highlight)"/><rect x="832" y={358+i*33} width="18" height="4" fill="var(--room-outline)"/></g>)}
        <path d="M145 410h58v62h-58M151 472h46v8h-46" fill="#b17e5c"/><g className="room-plant" fill="var(--room-leaf)"><path d="M169 333h9v81h-9M139 353h30v20h-30M178 335h35v22h-35M150 313h24v24h-24M180 379h33v17h-33"/></g>
        <path d="M291 480H725v57H291M281 490h10v38h-10M725 490h10v38h-10" fill="var(--room-fabric)"/><path d="M306 490H709v36H306Z" fill="none" stroke="var(--room-highlight)" strokeWidth="4" opacity=".65"/>
        <path d="M70 348h51v8H70M76 356h7v81h-7M109 356h7v81h-7" fill="var(--room-wood)"/>
        {theme === "woodland" && <g><path d="M45 61h18v89H45m0-70h44v10H45m17 11h37v8H62" fill="var(--room-wood)"/><path d="M66 74h20v21H66m13 19h16v21H79m-30 7h19v23H49" fill="var(--room-leaf)"/><path d="M230 427h37v34h-37m4-39h29v7h-29" fill="#a58d69"/><path d="M237 435h23m-23 9h23" stroke="#665744" strokeWidth="3"/></g>}
        {theme === "rose" && <g><path d="M245 340h12v117h-12m-32 0 33-117h11l33 117" fill="none" stroke="#8d6956" strokeWidth="7"/><rect x="214" y="320" width="79" height="86" fill="#eee0bf"/><path d="M233 384v-36h30v36m-23-18h16" stroke="#bd8885" strokeWidth="8" fill="none"/><path d="M57 47h848" stroke="#ad936e" strokeWidth="2"/>{[0,1,2,3,4,5,6,7].map(i=><rect key={i} x={80+i*110} y={50+(i%2)*8} width="6" height="8" fill="#edcf95"/>)}</g>}
        {theme === "ocean" && <g><path d="M236 362h43v80h-43" fill="#b7ac86"/><path d="M232 361h51v9h-51m4 29h43m-43 30h43" stroke="#737c70" strokeWidth="5"/><circle cx="871" cy="263" r="24" fill="none" stroke="#d6be93" strokeWidth="12"/><path d="M868 234h7v16h-7m0 27h7v16h-7" fill="#b77760"/><path d="M215 477h35v7h-35m4-6 7-8 7 8 7-9 7 9" fill="#d1b8a1"/></g>}
      </svg>
      <button className="room-object object-computer" onClick={() => onOpen("desk")} aria-label="Open files on the computer"><span>My files <b>{count || "↗"}</b></span></button>
      <button className="room-object object-books" onClick={() => onOpen("stats")} aria-label="Open activity journal"><span>Activity journal</span></button>
      <button className="room-object object-calendar" onClick={() => onOpen("scheduler")} aria-label="Open scheduler calendar"><span>Routines</span></button>
      <button className="room-object object-drawers" onClick={onSettings} aria-label="Open settings drawers"><span>Settings</span></button>
      <button className="room-object object-lamp" onClick={() => {setLamp(!lamp); setSpeech(lamp ? "Moonlight it is. Very cinematic." : "A little glow makes everything feel like home.");}} aria-label={lamp ? "Turn lamp off" : "Turn lamp on"}><span>{lamp ? "Lights off" : "Lights on"}</span></button>
      <button className="room-object object-plant" onClick={() => {setWatered(!watered); setSpeech(watered ? "Let’s let the roots breathe for a bit." : "One sip for Fern. Look at that little overachiever grow.");}} aria-label="Water the plant"><span>{watered ? "Happy plant ♡" : "Water Fern"}</span></button>
      <button className="room-object object-tea" onClick={() => {setMood("sleepy"); setSpeech("Tea break. The files can wait one tiny minute."); setPosition(43);}} aria-label="Give Pip a tea break"><span>Tea with Pip</span></button>
      <motion.div className={`room-pip ${walking ? "pip-walking" : ""} ${direction < 0 ? "pip-left" : ""}`} animate={{left: `${busy ? 59 : position}%`}} transition={{duration: reduced ? 0 : 3, ease:"linear"}}>
        <div className="pip-bubble" role="status">{busy ? "Coming through! Important little files on board." : done ? "Ta-da! Every file has a home. I deserve a biscuit." : speech}</div>
        <button className="pip-pet" onClick={pet} aria-label="Pet Pip"><div className="pip-body"><NeatifyMascot size={100} state={busy ? "carrying" : done ? "celebrating" : walking ? "walking" : mood} /><i className="pip-foot foot-left"/><i className="pip-foot foot-right"/></div><span>{mood === "happy" ? "♥" : "Pip"}</span></button>
      </motion.div>
      {watered && <span className="plant-heart">♡</span>}
    </div>
    <footer className="room-dock"><div><strong>Stay a little. Tidy a little.</strong><small><button className="room-guide-link" onClick={() => setTour(0)}>Room guide ↗</button></small></div><button onClick={onFolder}>＋ Bring a folder</button><label>ROOM<select aria-label="Room theme" value={theme} onChange={e => setTheme(e.target.value)}><option value="woodland">Woodland studio</option><option value="rose">Rose atelier</option><option value="ocean">Seaside hideaway</option></select></label></footer>
    {tour !== null && <Sheet className="room-tour" title={lessons[tour][0]} subtitle={`Pip’s field notes · ${tour + 1} of ${lessons.length}`} onClose={closeTour}>
      <p>{lessons[tour][1]}</p><div className="tour-dots" aria-label={`Step ${tour + 1} of ${lessons.length}`}>{lessons.map((_, i) => <span key={i} className={i === tour ? "active" : ""}/>)}</div>
      <footer className="sheet-footer"><button className="text-button" onClick={closeTour}>Explore on my own</button>{tour > 0 && <button className="secondary" onClick={() => setTour(tour - 1)}>Back</button>}<button className="primary" onClick={() => tour === lessons.length - 1 ? closeTour() : setTour(tour + 1)}>{tour === lessons.length - 1 ? "Let me in" : "Next →"}</button></footer>
    </Sheet>}
  </section>;
}
