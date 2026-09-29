import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

export type MascotState =
  | "idle"
  | "walking"
  | "happy"
  | "curious"
  | "working"
  | "carrying"
  | "scanning"
  | "organizing"
  | "confused"
  | "sleepy"
  | "sitting"
  | "celebrating"
  | "success"
  | "error"
  | "sleeping"
  | "empty";
const aliases: Partial<Record<MascotState, string>> = {
  walking: "carrying",
  success: "celebrating",
  error: "confused",
  sleeping: "sleepy",
  empty: "idle",
};

/** Shared brand asset; never draw a screen-specific version of the character. */
export default function NeatifyMascot({
  state = "idle",
  size = 64,
  portrait = false,
  decorative = true,
  onInteract,
}: {
  state?: MascotState;
  size?: number;
  portrait?: boolean;
  decorative?: boolean;
  onInteract?: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [blinking, setBlinking] = useState(false);
  useEffect(() => {
    setBlinking(false);
    if (reduceMotion || portrait || !["idle", "sitting"].includes(state))
      return;
    let closeEyes: ReturnType<typeof setTimeout> | undefined;
    const timer = setInterval(() => {
      setBlinking(true);
      closeEyes = setTimeout(() => setBlinking(false), 140);
    }, 1500);
    return () => {
      clearInterval(timer);
      clearTimeout(closeEyes);
    };
  }, [state, portrait, reduceMotion]);
  const iconSize = [16, 24, 32, 48, 64, 128, 256].find((n) => n >= size) ?? 256;
  const expression = aliases[state] ?? state;
  const src = portrait
    ? `/mascot/head-${iconSize}.png`
    : expression === "sitting"
      ? `/mascot/sitting-eye-${blinking ? "closed" : "open"}.png`
      : `/mascot/${blinking ? "blink" : expression}.png`;
  return (
    <img
      src={src}
      alt={decorative ? "" : `Neatify woodland companion, ${state}`}
      aria-hidden={decorative || undefined}
      draggable={false}
      role={onInteract ? "button" : undefined}
      tabIndex={onInteract ? 0 : undefined}
      onClick={onInteract}
      onKeyDown={(event) => {
        if (onInteract && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onInteract();
        }
      }}
      width={size}
      height={size}
      className={`neatify-mascot mascot-${state} ${!reduceMotion && !portrait && expression === "celebrating" ? "mascot-success" : ""}`}
      style={{
        width: size,
        height: size,
        imageRendering: "pixelated",
        objectFit: "contain",
        flexShrink: 0,
      }}
    />
  );
}
