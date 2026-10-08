import { useCallback, useEffect, useRef, useState } from "react";

export type CameraStatus = "idle" | "requesting" | "active" | "denied" | "not-found" | "in-use" | "unsupported" | "disconnected" | "error";

export interface CameraState {
  status: CameraStatus;
  stream: MediaStream | null;
  message: string | null;
  hasAudio: boolean;
}

const MESSAGES: Record<string, { status: CameraStatus; message: string }> = {
  NotAllowedError: { status: "denied", message: "Camera access was blocked. Allow camera access in your browser's address bar, then try again." },
  SecurityError: { status: "denied", message: "Camera access is not allowed on this page. Open TrustPRO over a secure (https) connection." },
  NotFoundError: { status: "not-found", message: "No camera was found. Connect a webcam and try again." },
  NotReadableError: { status: "in-use", message: "Your camera is being used by another application. Close other apps that use the camera and try again." },
  OverconstrainedError: { status: "error", message: "Your camera does not support the required settings." },
  AbortError: { status: "error", message: "The camera could not be started. Please try again." },
};

const MIC_DENIED = "Microphone access was blocked. The interview needs your microphone. Allow microphone access in your browser's address bar, then try again.";

/** Camera (and optionally microphone) access with clear, user-facing failure states. */
export function useCamera(options: { audio?: boolean; width?: number; height?: number } = {}) {
  const { audio = false, width = 1280, height = 720 } = options;
  const [state, setState] = useState<CameraState>({ status: "idle", stream: null, message: null, hasAudio: false });
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => { t.onended = null; t.stop(); });
    streamRef.current = null;
    setState({ status: "idle", stream: null, message: null, hasAudio: false });
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState({ status: "unsupported", stream: null, hasAudio: false, message: "This browser cannot access a camera. Use a recent version of Chrome, Edge, Firefox or Safari." });
      return null;
    }
    setState((s) => ({ ...s, status: "requesting", message: null }));
    const video: MediaTrackConstraints = { width: { ideal: width }, height: { ideal: height }, facingMode: "user" };
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video, audio: audio ? { echoCancellation: true, noiseSuppression: true } : false });
      } catch (err) {
        // Distinguish "camera blocked" from "microphone blocked" so the guidance is precise.
        if (audio && err instanceof DOMException && err.name === "NotAllowedError") {
          const camOnly = await navigator.mediaDevices.getUserMedia({ video }).catch(() => null);
          if (camOnly) {
            camOnly.getTracks().forEach((t) => t.stop());
            setState({ status: "denied", stream: null, hasAudio: false, message: MIC_DENIED });
            return null;
          }
        }
        if (audio && err instanceof DOMException && err.name === "NotFoundError") {
          const camOnly = await navigator.mediaDevices.getUserMedia({ video }).catch(() => null);
          if (camOnly) {
            camOnly.getTracks().forEach((t) => t.stop());
            setState({ status: "not-found", stream: null, hasAudio: false, message: "No microphone was found. Connect a microphone or headset and try again." });
            return null;
          }
        }
        throw err;
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = stream;
      const onEnded = () => setState((s) => ({
        ...s, status: "disconnected",
        message: "Your camera or microphone was disconnected. Reconnect it to continue.",
      }));
      stream.getTracks().forEach((t) => { t.onended = onEnded; });
      setState({ status: "active", stream, message: null, hasAudio: stream.getAudioTracks().length > 0 });
      return stream;
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      const mapped = MESSAGES[name] ?? { status: "error" as CameraStatus, message: "The camera could not be started. Please check your device and try again." };
      setState({ status: mapped.status, stream: null, message: mapped.message, hasAudio: false });
      return null;
    }
  }, [audio, width, height]);

  useEffect(() => () => { streamRef.current?.getTracks().forEach((t) => t.stop()); }, []);

  return { ...state, start, stop };
}

/** Attach a stream to a <video> element. */
export function useVideoStream(stream: MediaStream | null) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.srcObject !== stream) el.srcObject = stream;
    if (stream) el.play().catch(() => undefined);
  }, [stream]);
  return ref;
}

/** Average brightness (0-255) of the current video frame - used for a "poor lighting" hint. */
export function frameBrightness(video: HTMLVideoElement): number | null {
  if (!video.videoWidth) return null;
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 36;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, 64, 36);
  const { data } = ctx.getImageData(0, 0, 64, 36);
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  return sum / (data.length / 4);
}
