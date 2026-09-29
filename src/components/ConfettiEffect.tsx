import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function ConfettiEffect() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Left side burst
    confetti({
      particleCount: 12,
      angle: 60,
      spread: 45,
      origin: { x: 0, y: 0.9 },
      colors: ["#54ad8e", "#edb877", "#b8a4d1"], // subtle indigo palette
    });

    // Right side burst
    confetti({
      particleCount: 12,
      angle: 120,
      spread: 45,
      origin: { x: 1, y: 0.9 },
      colors: ["#54ad8e", "#edb877", "#b8a4d1"],
    });
  }, []);

  return null;
}
