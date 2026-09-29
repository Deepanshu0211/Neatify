import PixelRoom from "./PixelRoom";
import { MascotState } from "./NeatifyMascot";
import type { AmbientState } from "../lib/useAmbientState";

export type SceneContext = "workspace" | "bookshelf" | "window" | "workshop";

export default function AmbientScene({
  context = "workspace",
  state = "idle",
  onMascotClick,
  ambient,
}: {
  context?: SceneContext;
  state?: MascotState;
  onMascotClick?: () => void;
  ambient?: AmbientState;
}) {
  return (
    <div className={`ambient-scene scene-${context}`}>
      <PixelRoom
        happy={state === "success"}
        context={context}
        onMascotClick={onMascotClick}
        ambient={ambient}
      />
    </div>
  );
}
