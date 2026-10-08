import { useCallback, useRef, useState } from "react";
import { ApiError } from "../api/client";
import { interviewApi } from "../api/endpoints";

export type RecorderStatus = "idle" | "recording" | "stopping" | "stopped" | "error";

export interface RecorderState {
  status: RecorderStatus;
  uploadedChunks: number;
  pendingChunks: number;
  bytesUploaded: number;
  retrying: boolean;
  error: string | null;
}

// 6 s parts: half as many upload requests, which matters when each one crosses Vercel, a tunnel
// and a remote database.
const TIMESLICE_MS = 6000;
const MIME_TYPES = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];

export function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Records the interview with MediaRecorder and uploads it in sequential chunks while the
 * interview is running. Failed uploads are retried with backoff; chunks are kept in memory
 * until the server acknowledges them, so a short network drop loses nothing.
 */
export function useRecorder(interviewId: number) {
  const [state, setState] = useState<RecorderState>({
    status: "idle", uploadedChunks: 0, pendingChunks: 0, bytesUploaded: 0, retrying: false, error: null,
  });
  const recorder = useRef<MediaRecorder | null>(null);
  const queue = useRef<Blob[]>([]);
  const seq = useRef(0);
  const pumping = useRef(false);
  const startedAt = useRef<number | null>(null);
  const stoppedAt = useRef<number | null>(null);
  const drainWaiters = useRef<(() => void)[]>([]);

  const update = (patch: Partial<RecorderState>) => setState((s) => ({ ...s, ...patch, pendingChunks: queue.current.length }));

  const pump = useCallback(async () => {
    if (pumping.current) return;
    pumping.current = true;
    let failures = 0;
    while (queue.current.length) {
      const blob = queue.current[0];
      try {
        const ack = await interviewApi.uploadChunk(interviewId, seq.current, blob);
        seq.current = ack.next_seq;
        queue.current.shift();
        failures = 0;
        update({ uploadedChunks: ack.next_seq, bytesUploaded: ack.bytes_received, retrying: false, error: null });
      } catch (err) {
        if (err instanceof ApiError && err.code === "CHUNK_OUT_OF_ORDER") {
          const expected = Number(err.details.expected_seq);
          if (Number.isFinite(expected) && expected > seq.current) {
            // The server already has chunks we thought were lost (a response went missing).
            const already = expected - seq.current;
            queue.current.splice(0, already);
            seq.current = expected;
            continue;
          }
        }
        if (err instanceof ApiError && err.status >= 400 && err.status < 500 && err.code !== "CHUNK_OUT_OF_ORDER") {
          update({ status: "error", error: err.message, retrying: false });
          break;
        }
        failures += 1;
        update({ retrying: true, error: "Connection problem - the recording will keep uploading when it is restored." });
        await sleep(Math.min(16000, 1000 * 2 ** Math.min(failures, 4)));
      }
    }
    pumping.current = false;
    if (!queue.current.length) {
      drainWaiters.current.splice(0).forEach((resolve) => resolve());
    }
  }, [interviewId]);

  const start = useCallback((stream: MediaStream) => {
    const mimeType = pickMimeType();
    if (!mimeType) {
      update({ status: "error", error: "This browser cannot record video. Use a recent version of Chrome, Edge or Firefox." });
      return false;
    }
    const rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 800_000, audioBitsPerSecond: 64_000 });
    rec.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        queue.current.push(e.data);
        update({});
        void pump();
      }
    };
    rec.onerror = () => update({ status: "error", error: "Recording stopped unexpectedly. Please end the interview and contact support." });
    rec.start(TIMESLICE_MS);
    startedAt.current = performance.now();
    recorder.current = rec;
    update({ status: "recording" });
    return true;
  }, [pump]);

  /** Milliseconds since recording started - used to timestamp live frames so they line up with the video. */
  const offsetMs = useCallback(() => (startedAt.current == null ? null : performance.now() - startedAt.current), []);

  /** Stop recording and wait (up to `timeoutMs`) until every chunk is uploaded. */
  const stop = useCallback(async (timeoutMs = 120_000): Promise<{ durationMs: number; chunkCount: number; complete: boolean }> => {
    const rec = recorder.current;
    update({ status: "stopping" });
    if (rec && rec.state !== "inactive") {
      await new Promise<void>((resolve) => {
        rec.addEventListener("stop", () => resolve(), { once: true });
        rec.stop();
      });
    }
    stoppedAt.current = performance.now();
    await sleep(50);                 // let the final dataavailable event enqueue
    void pump();
    const drained = queue.current.length === 0 && !pumping.current
      ? true
      : await Promise.race([
        new Promise<boolean>((resolve) => drainWaiters.current.push(() => resolve(true))),
        sleep(timeoutMs).then(() => false),
      ]);
    update({ status: drained ? "stopped" : "error", error: drained ? null : "Some of the recording could not be uploaded." });
    const durationMs = Math.round((stoppedAt.current ?? performance.now()) - (startedAt.current ?? performance.now()));
    return { durationMs, chunkCount: seq.current, complete: drained };
  }, [pump]);

  return { ...state, start, stop, offsetMs };
}
