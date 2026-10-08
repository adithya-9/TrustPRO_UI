import { CameraOff, RefreshCw, VideoOff } from "lucide-react";
import type { CameraStatus } from "../../hooks/useCamera";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";

/** Full-bleed state shown inside a video frame when the camera is not streaming. */
export function CameraStatusPanel({ status, message, onStart, dark = true }: {
  status: CameraStatus; message: string | null; onStart: () => void; dark?: boolean;
}) {
  const text = dark ? "text-white" : "text-ink-900";
  const sub = dark ? "text-white/65" : "text-ink-500";
  if (status === "requesting") {
    return (
      <div className={`flex h-full flex-col items-center justify-center gap-3 p-6 text-center ${text}`}>
        <Spinner className="size-7" />
        <p className="font-medium">Waiting for camera permission…</p>
        <p className={`max-w-sm text-sm ${sub}`}>Your browser will ask to use your camera. Choose “Allow”.</p>
      </div>
    );
  }
  if (status === "idle") {
    return (
      <div className={`flex h-full flex-col items-center justify-center gap-4 p-6 text-center ${text}`}>
        <div className="grid size-14 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15"><VideoOff className="size-6" /></div>
        <div>
          <p className="font-semibold">Camera is off</p>
          <p className={`mt-1 max-w-sm text-sm ${sub}`}>Turn on your camera to continue. Nothing is recorded until you start.</p>
        </div>
        <Button onClick={onStart}>Turn on camera</Button>
      </div>
    );
  }
  return (
    <div className={`flex h-full flex-col items-center justify-center gap-4 p-6 text-center ${text}`} role="alert">
      <div className="grid size-14 place-items-center rounded-2xl bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30"><CameraOff className="size-6" /></div>
      <div>
        <p className="font-semibold">
          {status === "denied" ? "Permission needed" : status === "disconnected" ? "Camera disconnected" : "Camera unavailable"}
        </p>
        <p className={`mt-1 max-w-sm text-sm ${sub}`}>{message}</p>
      </div>
      <Button onClick={onStart} variant={dark ? "light" : "secondary"} icon={<RefreshCw className="size-4" />}>Try again</Button>
    </div>
  );
}
