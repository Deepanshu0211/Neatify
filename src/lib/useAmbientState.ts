import { useState, useEffect, useCallback } from "react";

/* ── Time-of-day phases ───────────────────────────────────────────── */
export type TimePhase = "night" | "dawn" | "sunrise" | "morning" | "day" | "afternoon" | "sunset" | "dusk";

/* ── Weather condition (simplified) ──────────────────────────────── */
export type WeatherCondition =
  | "clear"
  | "partly_cloudy"
  | "cloudy"
  | "foggy"
  | "drizzle"
  | "rain"
  | "heavy_rain"
  | "snow"
  | "thunderstorm";

export interface AmbientState {
  phase: TimePhase;
  weather: WeatherCondition;
  temperature: number | null;
  hour: number;
  /** 0-1 how far through the current phase */
  phaseProgress: number;
  /** Is the moon visible? */
  moonVisible: boolean;
  /** Is the sun visible? */
  sunVisible: boolean;
  /** Star opacity 0-1 */
  starOpacity: number;
  weatherStatus?: "loading" | "live" | "unavailable";
  weatherUpdated?: number;
}

/* ── Helpers ──────────────────────────────────────────────────────── */
function getPhase(hour: number, minute: number): { phase: TimePhase; progress: number } {
  const t = hour + minute / 60;
  // Night:       0:00 – 4:30
  // Dawn:        4:30 – 5:30
  // Sunrise:     5:30 – 6:30
  // Morning:     6:30 – 10:00
  // Day:        10:00 – 15:00
  // Afternoon:  15:00 – 17:00
  // Sunset:     17:00 – 18:30
  // Dusk:       18:30 – 20:00
  // Night:      20:00 – 24:00
  if (t < 4.5) return { phase: "night", progress: t / 4.5 };
  if (t < 5.5) return { phase: "dawn", progress: (t - 4.5) / 1 };
  if (t < 6.5) return { phase: "sunrise", progress: (t - 5.5) / 1 };
  if (t < 10) return { phase: "morning", progress: (t - 6.5) / 3.5 };
  if (t < 15) return { phase: "day", progress: (t - 10) / 5 };
  if (t < 17) return { phase: "afternoon", progress: (t - 15) / 2 };
  if (t < 18.5) return { phase: "sunset", progress: (t - 17) / 1.5 };
  if (t < 20) return { phase: "dusk", progress: (t - 18.5) / 1.5 };
  return { phase: "night", progress: (t - 20) / 4 };
}

function decodeWMO(code: number): WeatherCondition {
  // WMO weather interpretation codes → simplified condition
  if (code === 0) return "clear";
  if (code <= 2) return "partly_cloudy";
  if (code === 3) return "cloudy";
  if (code >= 45 && code <= 48) return "foggy";
  if (code >= 51 && code <= 55) return "drizzle";
  if (code >= 56 && code <= 57) return "drizzle"; // freezing drizzle
  if (code >= 61 && code <= 63) return "rain";
  if (code >= 64 && code <= 67) return "heavy_rain";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 80 && code <= 82) return "rain";
  if (code >= 85 && code <= 86) return "snow";
  if (code >= 95) return "thunderstorm";
  return "partly_cloudy";
}

async function fetchWeather(
  lat: number,
  lon: number,
): Promise<{ condition: WeatherCondition; temperature: number }> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
  const data = await res.json();
  if (!Number.isFinite(data.current?.weather_code) || !Number.isFinite(data.current?.temperature_2m)) throw new Error("Weather unavailable");
  return {
    condition: decodeWMO(data.current.weather_code),
    temperature: Math.round(data.current.temperature_2m),
  };
}

function getLocation(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not available"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
      { timeout: 8000, maximumAge: 300_000 },
    );
  });
}

/* ── Hook ─────────────────────────────────────────────────────────── */
export function useAmbientState(): AmbientState {
  const computeTime = useCallback(() => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const { phase, progress } = getPhase(hour, minute);
    const t = hour + minute / 60;

    return {
      hour,
      phase,
      phaseProgress: progress,
      moonVisible: t < 5.5 || t >= 18.5,
      sunVisible: t >= 5.5 && t < 18.5,
      starOpacity: t < 4.5 ? 1 : t < 5.5 ? 1 - (t - 4.5) : t >= 20 ? Math.min(1, (t - 20) / 1.5) : t >= 18.5 ? (t - 18.5) / 1.5 : 0,
    };
  }, []);

  const [state, setState] = useState<AmbientState>(() => ({
    ...computeTime(),
    weather: "clear",
    temperature: null,
    weatherStatus: "loading",
  }));

  // Update time every 30 seconds
  useEffect(() => {
    const tick = () => {
      setState((prev) => ({ ...prev, ...computeTime() }));
    };
    tick();
    const timer = setInterval(tick, 30_000);
    window.addEventListener("focus", tick);
    return () => { clearInterval(timer); window.removeEventListener("focus", tick); };
  }, [computeTime]);

  // Fetch weather on mount and every 15 minutes
  useEffect(() => {
    let cancelled = false, checking = false;
    const update = async () => {
      if (checking) return;
      checking = true;
      try {
        const loc = await getLocation();
        const weather = await fetchWeather(loc.lat, loc.lon);
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            weather: weather.condition,
            temperature: weather.temperature,
            weatherStatus: "live",
            weatherUpdated: Date.now(),
          }));
        }
      } catch {
        if (!cancelled) setState(prev => ({ ...prev, weatherStatus: "unavailable", temperature: null }));
      } finally {
        checking = false;
      }
    };
    void update();
    const timer = setInterval(() => void update(), 15 * 60 * 1000);
    window.addEventListener("online", update);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("online", update);
    };
  }, []);

  return state;
}
