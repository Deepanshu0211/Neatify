import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function ConfettiEffect() {
  useEffect(() => {
    // Left side burst
    confetti({
      particleCount: 12,
      angle: 60,
      spread: 45,
      origin: { x: 0, y: 0.9 },
      colors: ["#6366F1", "#A5B4FC"], // subtle indigo palette
    });

    // Right side burst
    confetti({
      particleCount: 12,
      angle: 120,
      spread: 45,
      origin: { x: 1, y: 0.9 },
      colors: ["#6366F1", "#A5B4FC"],
    });
  }, []);

  return null;
}
