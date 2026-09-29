import { useMemo } from "react";
import type { AmbientState, TimePhase, WeatherCondition } from "../lib/useAmbientState";

/* ── Colour palettes for each phase ─────────────────────────────── */
interface Palette {
  sky: string[];        // gradient stops top → bottom
  wall: string;
  wallDot: string;
  floor: string;
  floorLine: string;
  floorPlank: string;
  windowFrame: string;
  windowSill: string;
  windowLight: string;  // glow from window
  treeLight: string;
  treeDark: string;
  shelfWood: string;
  shelfTop: string;
  deskWood: string;
  deskTop: string;
  deskLeg: string;
  mugBody: string;
  mugShadow: string;
  steamColor: string;
  plantStem: string;
  plantLeaf: string;
  plantPot: string;
  plantPotShadow: string;
  catBody: string;
  bookColors: string[];
  curtainColor: string;
  curtainShadow: string;
  borderColor: string;
}

const palettes: Record<TimePhase, Palette> = {
  night: {
    sky: ["#0d1b2a", "#1b2838", "#1c3045"],
    wall: "#2a2d3a", wallDot: "#24273a",
    floor: "#3a3228", floorLine: "#2a2520", floorPlank: "#322c22",
    windowFrame: "#4a4535", windowSill: "#5a5240", windowLight: "#2a3548",
    treeLight: "#2a4538", treeDark: "#1a3028",
    shelfWood: "#4a3d2a", shelfTop: "#5a4d38",
    deskWood: "#4a3d2a", deskTop: "#5a4d38", deskLeg: "#3a3020",
    mugBody: "#d8d0c0", mugShadow: "#4a4030",
    steamColor: "#6a6555",
    plantStem: "#2a4a30", plantLeaf: "#3a5a40", plantPot: "#5a4030", plantPotShadow: "#4a3020",
    catBody: "#3a3530", bookColors: ["#4a3545", "#2a3a4a", "#4a4a2a", "#3a2a3a"],
    curtainColor: "#5a3030", curtainShadow: "#4a2525",
    borderColor: "#3a3530",
  },
  dawn: {
    sky: ["#2a1a3a", "#4a2848", "#8a4858", "#c87858"],
    wall: "#c8baa0", wallDot: "#bab098",
    floor: "#c8a878", floorLine: "#8a7050", floorPlank: "#b89868",
    windowFrame: "#8a7555", windowSill: "#a08a68", windowLight: "#e8c890",
    treeLight: "#5a7a58", treeDark: "#3a5a38",
    shelfWood: "#8a7048", shelfTop: "#b8986a",
    deskWood: "#8a7048", deskTop: "#b8986a", deskLeg: "#7a6040",
    mugBody: "#f0e8d8", mugShadow: "#8a7050",
    steamColor: "#b0a888",
    plantStem: "#5a8a58", plantLeaf: "#6a9a68", plantPot: "#a87858", plantPotShadow: "#886848",
    catBody: "#c0b8a0", bookColors: ["#7a5a6a", "#5a7080", "#8a8a5a", "#6a5a7a"],
    curtainColor: "#c87060", curtainShadow: "#a85848",
    borderColor: "#a8a088",
  },
  sunrise: {
    sky: ["#4a2838", "#c85848", "#e8a858", "#f8d878"],
    wall: "#e8dcc0", wallDot: "#dcd0b0",
    floor: "#d0a878", floorLine: "#907850", floorPlank: "#c09868",
    windowFrame: "#9a8060", windowSill: "#c0a878", windowLight: "#f8d868",
    treeLight: "#68986a", treeDark: "#487a48",
    shelfWood: "#907850", shelfTop: "#c0a070",
    deskWood: "#907850", deskTop: "#c0a070", deskLeg: "#806848",
    mugBody: "#f5f0e0", mugShadow: "#907850",
    steamColor: "#c0b898",
    plantStem: "#68986a", plantLeaf: "#78a878", plantPot: "#b88060", plantPotShadow: "#987050",
    catBody: "#d0c8b0", bookColors: ["#885a70", "#588878", "#989858", "#786888"],
    curtainColor: "#d87858", curtainShadow: "#b86848",
    borderColor: "#b8b098",
  },
  morning: {
    sky: ["#68a8d0", "#88c0e0", "#a8d8e8", "#c8e8f0"],
    wall: "#efe7cf", wallDot: "#dcd3b8",
    floor: "#d1ae7c", floorLine: "#927956", floorPlank: "#bc986d",
    windowFrame: "#9c8c6e", windowSill: "#d1c0a0", windowLight: "#f0e8c8",
    treeLight: "#789c86", treeDark: "#587c6d",
    shelfWood: "#947b58", shelfTop: "#c7a478",
    deskWood: "#8e7452", deskTop: "#c7a478", deskLeg: "#7d6f50",
    mugBody: "#f3ead4", mugShadow: "#937052",
    steamColor: "#b5aa91",
    plantStem: "#64836a", plantLeaf: "#7c9670", plantPot: "#ae8061", plantPotShadow: "#8e6d52",
    catBody: "#d8d0c0", bookColors: ["#789c86", "#ce9676", "#d2b467", "#8ca4b5"],
    curtainColor: "#d69b7e", curtainShadow: "#c0886a",
    borderColor: "#b7b29a",
  },
  day: {
    sky: ["#4898d0", "#68b8e8", "#88d0f0", "#a0e0f8"],
    wall: "#f0e8d0", wallDot: "#e0d8c0",
    floor: "#d8b480", floorLine: "#987a58", floorPlank: "#c8a070",
    windowFrame: "#a08868", windowSill: "#d8c8a8", windowLight: "#fffff0",
    treeLight: "#80a888", treeDark: "#608870",
    shelfWood: "#987c58", shelfTop: "#c8a878",
    deskWood: "#907850", deskTop: "#c8a878", deskLeg: "#807050",
    mugBody: "#f8f0e0", mugShadow: "#987858",
    steamColor: "#b8b098",
    plantStem: "#68886a", plantLeaf: "#80a070", plantPot: "#b08060", plantPotShadow: "#907050",
    catBody: "#e0d8c8", bookColors: ["#80a888", "#d0a078", "#d8b868", "#90a8b8"],
    curtainColor: "#d8a080", curtainShadow: "#c08868",
    borderColor: "#c0b8a0",
  },
  afternoon: {
    sky: ["#5890c0", "#78b0d8", "#98c8e8", "#c8dce0"],
    wall: "#f0e0c0", wallDot: "#e0d4b0",
    floor: "#d0a870", floorLine: "#907050", floorPlank: "#c09060",
    windowFrame: "#987858", windowSill: "#d0b898", windowLight: "#f8e8c0",
    treeLight: "#78a080", treeDark: "#588068",
    shelfWood: "#907450", shelfTop: "#c0a070",
    deskWood: "#887048", deskTop: "#c0a070", deskLeg: "#786040",
    mugBody: "#f0e8d0", mugShadow: "#907050",
    steamColor: "#b0a888",
    plantStem: "#608868", plantLeaf: "#789868", plantPot: "#a87858", plantPotShadow: "#886848",
    catBody: "#d8d0b8", bookColors: ["#78a080", "#c89870", "#d0b058", "#88a0b0"],
    curtainColor: "#d09070", curtainShadow: "#b07858",
    borderColor: "#b8b090",
  },
  sunset: {
    sky: ["#c84838", "#e87838", "#f8b848", "#f8d870"],
    wall: "#e8d0a8", wallDot: "#d8c098",
    floor: "#c89868", floorLine: "#886848", floorPlank: "#b88858",
    windowFrame: "#907050", windowSill: "#c0a880", windowLight: "#f8c860",
    treeLight: "#68885a", treeDark: "#486838",
    shelfWood: "#886848", shelfTop: "#b89058",
    deskWood: "#806040", deskTop: "#b89058", deskLeg: "#705838",
    mugBody: "#e8e0c8", mugShadow: "#886848",
    steamColor: "#a89878",
    plantStem: "#587858", plantLeaf: "#688858", plantPot: "#a07050", plantPotShadow: "#805840",
    catBody: "#d0c0a8", bookColors: ["#685a5a", "#587068", "#888848", "#685870"],
    curtainColor: "#c87050", curtainShadow: "#a85838",
    borderColor: "#a8a078",
  },
  dusk: {
    sky: ["#1a1828", "#2a2848", "#4a3858", "#7a4858"],
    wall: "#8a8078", wallDot: "#7a7068",
    floor: "#8a7858", floorLine: "#5a5038", floorPlank: "#7a6848",
    windowFrame: "#6a5a40", windowSill: "#8a7858", windowLight: "#5a4858",
    treeLight: "#3a5a40", treeDark: "#283a28",
    shelfWood: "#6a5838", shelfTop: "#8a7850",
    deskWood: "#5a4830", deskTop: "#8a7850", deskLeg: "#4a3828",
    mugBody: "#c8c0b0", mugShadow: "#5a4838",
    steamColor: "#7a7060",
    plantStem: "#3a5838", plantLeaf: "#4a6848", plantPot: "#7a5840", plantPotShadow: "#5a4030",
    catBody: "#7a7068", bookColors: ["#4a3540", "#3a4a50", "#5a5a3a", "#4a3a4a"],
    curtainColor: "#8a5040", curtainShadow: "#6a3830",
    borderColor: "#6a6558",
  },
};

/* ── Weather overlays ────────────────────────────────────────────── */
function WeatherOverlay({ weather, phase }: { weather: WeatherCondition; phase: TimePhase }) {
  const isNight = phase === "night" || phase === "dusk";

  if (weather === "clear") return null;

  return (
    <g className="weather-overlay">
      {/* Clouds */}
      {(weather === "partly_cloudy" || weather === "cloudy") && (
        <g className="weather-clouds">
          <path d="M43 34H52V30H65V34H72V39H43Z" fill={isNight ? "#3a4555" : "#d8dce8"} opacity={weather === "cloudy" ? 0.9 : 0.6}>
            <animateTransform attributeName="transform" type="translate" values="0,0;8,0;0,0" dur="12s" repeatCount="indefinite" />
          </path>
          <path d="M80 38H88V34H100V38H108V43H80Z" fill={isNight ? "#4a5565" : "#e0e4f0"} opacity={weather === "cloudy" ? 0.85 : 0.5}>
            <animateTransform attributeName="transform" type="translate" values="0,0;-6,0;0,0" dur="15s" repeatCount="indefinite" />
          </path>
          {weather === "cloudy" && (
            <path d="M55 28H68V25H82V28H92V33H55Z" fill={isNight ? "#2a3545" : "#c8ccd8"} opacity={0.7}>
              <animateTransform attributeName="transform" type="translate" values="0,0;5,0;0,0" dur="18s" repeatCount="indefinite" />
            </path>
          )}
        </g>
      )}

      {/* Fog */}
      {weather === "foggy" && (
        <g className="weather-fog" opacity={0.4}>
          <rect x="30" y="40" width="95" height="3" fill={isNight ? "#4a5060" : "#d8dce8"} rx="1">
            <animateTransform attributeName="transform" type="translate" values="0,0;10,0;0,0" dur="8s" repeatCount="indefinite" />
          </rect>
          <rect x="35" y="50" width="80" height="2" fill={isNight ? "#4a5060" : "#d8dce8"} rx="1">
            <animateTransform attributeName="transform" type="translate" values="0,0;-8,0;0,0" dur="10s" repeatCount="indefinite" />
          </rect>
          <rect x="40" y="60" width="70" height="3" fill={isNight ? "#4a5060" : "#d8dce8"} rx="1">
            <animateTransform attributeName="transform" type="translate" values="0,0;6,0;0,0" dur="12s" repeatCount="indefinite" />
          </rect>
        </g>
      )}

      {/* Rain drops */}
      {(weather === "drizzle" || weather === "rain" || weather === "heavy_rain") && (
        <g className="weather-rain">
          {Array.from({ length: weather === "heavy_rain" ? 12 : weather === "rain" ? 8 : 4 }, (_, i) => (
            <line
              key={i}
              x1={35 + ((i * 37 + 13) % 85)}
              y1={25}
              x2={33 + ((i * 37 + 13) % 85)}
              y2={25 + (weather === "drizzle" ? 4 : 6)}
              stroke={isNight ? "#5a7a9a" : "#88a8c8"}
              strokeWidth={weather === "heavy_rain" ? 2 : 1}
              opacity={0.7}
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                values={`0,-10;-4,${weather === "drizzle" ? 50 : 65}`}
                dur={`${0.6 + (i % 3) * 0.2}s`}
                repeatCount="indefinite"
                begin={`${i * 0.1}s`}
              />
            </line>
          ))}
        </g>
      )}

      {/* Snow */}
      {weather === "snow" && (
        <g className="weather-snow">
          {Array.from({ length: 8 }, (_, i) => (
            <circle
              key={i}
              cx={38 + ((i * 29 + 7) % 80)}
              cy={28}
              r={1.5}
              fill={isNight ? "#8898a8" : "#e8eef8"}
              opacity={0.8}
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                values={`0,-5;${(i % 2 === 0 ? 3 : -3)},55`}
                dur={`${2 + (i % 3) * 0.5}s`}
                repeatCount="indefinite"
                begin={`${i * 0.3}s`}
              />
            </circle>
          ))}
        </g>
      )}

      {/* Thunderstorm (rain + lightning flash) */}
      {weather === "thunderstorm" && (
        <g className="weather-thunder">
          {Array.from({ length: 10 }, (_, i) => (
            <line
              key={i}
              x1={35 + ((i * 29 + 5) % 85)}
              y1={25}
              x2={32 + ((i * 29 + 5) % 85)}
              y2={31}
              stroke={isNight ? "#5a7a9a" : "#88a8c8"}
              strokeWidth={2}
              opacity={0.7}
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0,-10;-4,65"
                dur={`${0.5 + (i % 3) * 0.15}s`}
                repeatCount="indefinite"
                begin={`${i * 0.08}s`}
              />
            </line>
          ))}
          <rect x="30" y="23" width="95" height="62" fill="#fff" opacity={0}>
            <animate attributeName="opacity" values="0;0;0;0.15;0;0;0;0;0;0;0;0;0;0.1;0" dur="6s" repeatCount="indefinite" />
          </rect>
        </g>
      )}
    </g>
  );
}

/* ── Stars ────────────────────────────────────────────────────────── */
function Stars({ opacity }: { opacity: number }) {
  if (opacity <= 0) return null;
  const stars = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        x: 34 + ((i * 23 + 7) % 85),
        y: 26 + ((i * 17 + 3) % 30),
        size: 1 + (i % 2),
        delay: i * 0.3,
      })),
    [],
  );
  return (
    <g className="sky-stars" opacity={opacity}>
      {stars.map((s, i) => (
        <rect key={i} x={s.x} y={s.y} width={s.size} height={s.size} fill="#f8f0d8">
          <animate attributeName="opacity" values="0.3;1;0.3" dur={`${2 + s.delay}s`} repeatCount="indefinite" begin={`${s.delay}s`} />
        </rect>
      ))}
    </g>
  );
}

/* ── Sun / Moon ───────────────────────────────────────────────────── */
function CelestialBody({ ambient }: { ambient: AmbientState }) {
  const { phase, sunVisible, moonVisible, phaseProgress } = ambient;

  // Calculate Y position based on phase (arc path)
  const getSunY = () => {
    if (phase === "sunrise") return 52 - phaseProgress * 20;
    if (phase === "morning") return 32 - phaseProgress * 4;
    if (phase === "day") return 28;
    if (phase === "afternoon") return 28 + phaseProgress * 6;
    if (phase === "sunset") return 34 + phaseProgress * 20;
    return 60;
  };

  const getMoonY = () => {
    if (phase === "night") return 30 + Math.abs(phaseProgress - 0.5) * 10;
    if (phase === "dusk") return 50 - phaseProgress * 15;
    if (phase === "dawn") return 35 + phaseProgress * 20;
    return 60;
  };

  return (
    <>
      {sunVisible && (
        <g className="celestial-sun">
          {/* Sun glow */}
          <rect x="106" y={getSunY() - 6} width="20" height="20" fill="#f8e868" opacity={0.2} />
          {/* Sun body */}
          <rect x="110" y={getSunY() - 2} width="8" height="8" fill={phase === "sunset" ? "#f88838" : phase === "sunrise" ? "#f8a848" : "#edc96d"} />
          {/* Sun rays */}
          <rect x="112" y={getSunY() - 5} width="4" height="2" fill={phase === "sunset" ? "#f87828" : "#f8d858"} opacity={0.6}>
            <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3s" repeatCount="indefinite" />
          </rect>
          <rect x="112" y={getSunY() + 9} width="4" height="2" fill={phase === "sunset" ? "#f87828" : "#f8d858"} opacity={0.6}>
            <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3s" repeatCount="indefinite" begin="0.5s" />
          </rect>
          <rect x="107" y={getSunY() + 1} width="2" height="4" fill={phase === "sunset" ? "#f87828" : "#f8d858"} opacity={0.5}>
            <animate attributeName="opacity" values="0.3;0.7;0.3" dur="3.5s" repeatCount="indefinite" begin="1s" />
          </rect>
          <rect x="119" y={getSunY() + 1} width="2" height="4" fill={phase === "sunset" ? "#f87828" : "#f8d858"} opacity={0.5}>
            <animate attributeName="opacity" values="0.3;0.7;0.3" dur="3.5s" repeatCount="indefinite" begin="1.5s" />
          </rect>
        </g>
      )}
      {moonVisible && (
        <g className="celestial-moon">
          {/* Moon glow */}
          <rect x="108" y={getMoonY() - 4} width="14" height="14" fill="#c8d8f0" opacity={0.1} />
          {/* Moon body */}
          <rect x="110" y={getMoonY()} width="8" height="8" fill="#e8e0d0" />
          {/* Moon shadow (crescent effect) */}
          <rect x="114" y={getMoonY()} width="4" height="8" fill="#d0c8b8" />
          {/* Moon craters */}
          <rect x="111" y={getMoonY() + 2} width="2" height="2" fill="#d8d0c0" />
          <rect x="113" y={getMoonY() + 5} width="1" height="1" fill="#d8d0c0" />
        </g>
      )}
    </>
  );
}

/* ── PixelFolder export ──────────────────────────────────────────── */
export function PixelFolder({
  size = 32,
  color = "gold",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={`pixel-icon pixel-${color}`}
    >
      <path
        d="M3 7H13V10H28V12H30V26H28V28H3V26H1V9H3Z"
        fill="var(--pixel-outline)"
      />
      <path d="M3 9H12V12H28V25H3Z" fill="var(--pixel-fill)" />
      <path d="M3 13H28V16H3Z" fill="var(--pixel-light)" />
      <path d="M5 23H26V25H5Z" fill="var(--pixel-shade)" />
    </svg>
  );
}

/* ── Main PixelRoom ──────────────────────────────────────────────── */
export default function PixelRoom({
  happy = false,
  context = "workspace",
  onMascotClick,
  ambient,
}: {
  happy?: boolean;
  context?: "workspace" | "bookshelf" | "window" | "workshop";
  onMascotClick?: () => void;
  ambient?: AmbientState;
}) {
  const defaultAmbient: AmbientState = {
    phase: "day",
    weather: "clear",
    temperature: null,
    hour: 12,
    phaseProgress: 0.5,
    moonVisible: false,
    sunVisible: true,
    starOpacity: 0,
  };

  const amb = ambient || defaultAmbient;
  const p = palettes[amb.phase];

  return (
    <svg
      className={`pixel-room ${happy ? "room-happy" : ""} phase-${amb.phase} weather-${amb.weather}`}
      viewBox="0 0 320 142"
      role="img"
      aria-label={`A cozy pixel-art desk — ${amb.phase}, ${amb.weather}${amb.temperature !== null ? `, ${amb.temperature}°C` : ""}`}
      shapeRendering="crispEdges"
    >
      {context === "bookshelf" && <title>A quiet reading corner</title>}
      {context === "window" && <title>A sunny picture window</title>}
      {context === "workshop" && <title>A small creative workshop</title>}

      <defs>
        {/* Wall pattern */}
        <pattern id="wallpaper" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill={p.wall} />
          <rect x="2" y="2" width="1" height="1" fill={p.wallDot} />
        </pattern>

        {/* Sky gradient */}
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          {p.sky.map((color, i) => (
            <stop key={i} offset={`${(i / (p.sky.length - 1)) * 100}%`} stopColor={color} />
          ))}
        </linearGradient>

        {/* Window glow */}
        <radialGradient id="windowGlow" cx="0.5" cy="0.6" r="0.6">
          <stop offset="0%" stopColor={p.windowLight} stopOpacity={0.4} />
          <stop offset="100%" stopColor={p.windowLight} stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* ─── Room frame / border ─────────────────────────────────── */}
      <path d="M8 4H312V8H316V134H312V138H8V134H4V8H8Z" fill={p.borderColor} />

      {/* ─── Wall ────────────────────────────────────────────────── */}
      <path d="M8 8H312V134H8Z" fill="url(#wallpaper)" />

      {/* ─── Indoor ambient glow from window ─────────────────────── */}
      <rect x="20" y="17" width="125" height="75" fill="url(#windowGlow)" opacity={amb.sunVisible ? 0.3 : 0.1} />

      {/* ─── Floor ───────────────────────────────────────────────── */}
      <path d="M8 112H312V134H8Z" fill={p.floor} />
      <path d="M8 112H312V115H8Z" fill={p.floorLine} />
      <path
        d="M8 125H312M52 115V125M125 125V134M207 115V125M275 125V134"
        stroke={p.floorPlank}
        strokeWidth="1"
      />

      {/* ─── Window ──────────────────────────────────────────────── */}
      {/* Frame outer */}
      <path d="M26 19H131V88H26Z" fill={p.windowFrame} />
      {/* Window inner — sky */}
      <path d="M30 23H127V84H30Z" fill="url(#skyGrad)" />
      {/* Upper sky pane */}
      <path d="M32 25H125V59H32Z" fill="url(#skyGrad)" opacity={0.6} />

      {/* ─── Stars (nighttime) ───────────────────────────────────── */}
      <Stars opacity={amb.starOpacity} />

      {/* ─── Celestial body (sun or moon) ────────────────────────── */}
      <CelestialBody ambient={amb} />

      {/* ─── Weather overlay in the window ───────────────────────── */}
      <WeatherOverlay weather={amb.weather} phase={amb.phase} />

      {/* ─── Default clouds (only if clear/partly cloudy) ────────── */}
      {(amb.weather === "clear" || amb.weather === "partly_cloudy") && (
        <g className="pixel-cloud">
          <path d="M43 34H52V30H65V34H72V39H43Z" fill={amb.phase === "night" || amb.phase === "dusk" ? "#3a4558" : "#faf6dc"} opacity={amb.weather === "clear" ? 0.4 : 0.7}>
            <animateTransform attributeName="transform" type="translate" values="0,0;5,0;0,0" dur="20s" repeatCount="indefinite" />
          </path>
          <path d="M96 42H103V38H116V42H122V47H96Z" fill={amb.phase === "night" || amb.phase === "dusk" ? "#3a4558" : "#faf6dc"} opacity={amb.weather === "clear" ? 0.3 : 0.6}>
            <animateTransform attributeName="transform" type="translate" values="0,0;-4,0;0,0" dur="25s" repeatCount="indefinite" />
          </path>
        </g>
      )}

      {/* ─── Trees / hills seen through window ───────────────────── */}
      <path
        d="M30 75H39V68H47V64H58V72H69V66H81V72H94V62H107V66H117V72H127V84H30Z"
        fill={p.treeLight}
      />
      <path d="M30 80H53V76H69V80H91V73H107V80H127V84H30Z" fill={p.treeDark} />

      {/* ─── Window dividers ─────────────────────────────────────── */}
      <path d="M76 23H81V84H76Z M30 52H127V57H30Z" fill={p.windowFrame} opacity={0.7} />

      {/* ─── Window sill ─────────────────────────────────────────── */}
      <path d="M23 85H134V91H23Z" fill={p.windowFrame} />
      <path d="M23 85H134V87H23Z" fill={p.windowSill} />

      {/* ─── Curtains ────────────────────────────────────────────── */}
      <path
        d="M20 17H32V63H28V68H20Z M126 17H139V68H130V63H126Z"
        fill={p.curtainColor}
      />
      <path d="M23 20H26V63H23Z M131 20H134V63H131Z" fill={p.curtainShadow} />

      {/* ─── Shelf ───────────────────────────────────────────────── */}
      <path d="M163 25H258V30H163Z" fill={p.shelfWood} />
      <path d="M168 30H172V35H168Z M248 30H252V35H248Z" fill={p.deskLeg} />

      {/* ─── Books on shelf ──────────────────────────────────────── */}
      <path d="M173 11H180V25H173Z" fill={p.bookColors[0]} />
      <path d="M181 8H187V25H181Z" fill={p.bookColors[1]} />
      <path d="M188 13H196V25H188Z" fill={p.bookColors[2]} />
      <path d="M199 12H204V25H199Z" fill={p.bookColors[3]} />
      {/* Book highlights */}
      <path d="M176 14H178V20H176Z M183 12H185V15H183Z" fill={p.windowSill} opacity={0.4} />

      {/* ─── Potted plant on shelf ───────────────────────────────── */}
      <path d="M228 14H242V25H228Z" fill={p.plantPot} />
      <path d="M230 11H240V15H230Z" fill={p.plantLeaf} />
      <path
        d="M232 6H236V14H232Z M237 8H244V12H237Z M225 8H232V12H225Z"
        fill={p.plantStem}
      />

      {/* ─── Desk ────────────────────────────────────────────────── */}
      <path
        d="M151 97H292V104H151Z M157 104H163V130H157Z M282 104H288V130H282Z"
        fill={p.deskWood}
      />
      <path d="M151 97H292V100H151Z" fill={p.deskTop} />
      <path d="M164 105H280V110H164Z" fill={p.shelfWood} />

      {/* ─── Desk lamp ───────────────────────────────────────────── */}
      <path d="M266 61H270V94H266Z M255 93H282V97H255Z" fill={p.plantStem} />
      <path d="M258 51H278V55H282V66H253V55H258Z" fill={p.bookColors[2]} />
      <path d="M256 65H279V68H256Z" fill={p.treeDark} />
      <path d="M260 56H264V62H260Z" fill={p.windowLight} opacity={amb.phase === "night" || amb.phase === "dusk" ? 0.9 : 0.4}>
        {(amb.phase === "night" || amb.phase === "dusk") && (
          <animate attributeName="opacity" values="0.7;0.95;0.7" dur="4s" repeatCount="indefinite" />
        )}
      </path>

      {/* ─── Lamp glow at night ──────────────────────────────────── */}
      {(amb.phase === "night" || amb.phase === "dusk") && (
        <rect x="252" y="55" width="30" height="45" fill={p.windowLight} opacity={0.08}>
          <animate attributeName="opacity" values="0.05;0.12;0.05" dur="4s" repeatCount="indefinite" />
        </rect>
      )}

      {/* ─── Mascot on desk ──────────────────────────────────────── */}
      <image
        className="desk-buddy"
        href={happy ? "/mascot/celebrating.png" : "/mascot/idle.png"}
        x="167"
        y="41"
        width="64"
        height="64"
        style={{ imageRendering: "pixelated" }}
        role={onMascotClick ? "button" : undefined}
        tabIndex={onMascotClick ? 0 : undefined}
        aria-label={
          onMascotClick ? "Talk to your Neatify companion" : undefined
        }
        onClick={onMascotClick}
        onKeyDown={(event) => {
          if (onMascotClick && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            onMascotClick();
          }
        }}
      />

      {/* ─── Mug ─────────────────────────────────────────────────── */}
      <path d="M236 85H247V96H236Z M247 87H251V93H247" fill={p.mugBody} />
      <path d="M238 85H245V87H238Z" fill={p.mugShadow} />
      {/* Steam */}
      <path
        className="tea-steam"
        d="M239 78V75H242V71"
        stroke={p.steamColor}
        strokeWidth="2"
        fill="none"
      />

      {/* ─── Cat sleeping on floor ───────────────────────────────── */}
      <path d="M36 111H58V114H63V125H32V118H36Z" fill={p.catBody} />
      <path d="M36 108H41V115H36Z M52 108H57V115H52Z" fill={p.catBody} />
      <path d="M38 115H55V123H38Z" fill={p.plantPot} />
      <path d="M40 118H44V120H40Z M49 118H53V120H49Z" fill={p.deskLeg} />
      <path d="M61 119H68V123H61Z" fill={p.catBody} />

      {/* ─── Floor plant ─────────────────────────────────────────── */}
      <path d="M85 108H104V128H85Z" fill={p.plantPot} />
      <path d="M88 128H101V132H88Z" fill={p.plantPotShadow} />
      <path
        d="M91 85H96V110H91Z M81 94H91V99H81Z M95 90H107V95H95Z M87 82H94V88H87Z M98 81H103V90H98Z"
        fill={p.plantLeaf}
      />
      <path d="M78 90H85V95H78Z M104 86H110V91H104Z" fill={p.treeLight} />

      {/* ─── Rug ─────────────────────────────────────────────────── */}
      <path d="M186 120H246V124H250V128H182V124H186Z" fill={p.windowSill} opacity={0.5} />

      {/* ─── Temperature indicator (tiny) ────────────────────────── */}
      {amb.temperature !== null && (
        <text
          x="298"
          y="14"
          fill={p.steamColor}
          fontSize="7"
          fontFamily="var(--pixel-font, monospace)"
          opacity={0.5}
        >
          {amb.temperature}°
        </text>
      )}
    </svg>
  );
}
