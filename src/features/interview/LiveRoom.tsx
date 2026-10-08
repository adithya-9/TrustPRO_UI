import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CircleDot, Square } from "lucide-react";
import { ApiError, errorMessage } from "../../api/client";
import { interviewApi } from "../../api/endpoints";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Logo } from "../../components/ui/Logo";
import { Modal } from "../../components/ui/Modal";
import { Spinner } from "../../components/ui/Spinner";
import { useCamera, useVideoStream } from "../../hooks/useCamera";
import { useRecorder } from "../../hooks/useRecorder";
import { clock } from "../../lib/format";
import type { Interview } from "../../types/api";

type CameraApi = ReturnType<typeof useCamera>;

/** The assessment itself: the camera is recorded and uploaded in chunks - nothing else runs here. */
export function LiveRoom({ interview, camera, onEnded }: {
  interview: Interview; camera: CameraApi; onEnded: (i: Interview) => void;
}) {
  const video = useVideoStream(camera.stream);
  const recorder = useRecorder(interview.interview_id);
  const [elapsed, setElapsed] = useState(0);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [ending, setEnding] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);
  const startedRef = useRef(false);

  // Start recording exactly once, as soon as the camera stream is there.
  useEffect(() => {
    if (startedRef.current || !camera.stream) return;
    startedRef.current = true;
    recorder.start(camera.stream);
  }, [camera.stream, recorder.start]);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = window.setInterval(() => {
      const offset = recorder.offsetMs();
      if (offset != null) setElapsed(offset);
    }, 1000);
    return () => window.clearInterval(t);
  }, [recorder.offsetMs]);

  // Keep the candidate from accidentally leaving mid-assessment.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (!ending) { e.preventDefault(); } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [ending]);

  const end = async () => {
    setConfirmEnd(false);
    setEnding(true);
    setEndError(null);
    const result = await recorder.stop();
    try {
      let ended: Interview;
      try {
        ended = await interviewApi.end(interview.interview_id, result.durationMs, result.chunkCount);
      } catch (err) {
        // If some chunks never made it, close the assessment with what the server has.
        if (err instanceof ApiError && err.code === "RECORDING_INCOMPLETE") {
          const received = Number(err.details.received_chunks);
          ended = await interviewApi.end(interview.interview_id, result.durationMs, received);
        } else throw err;
      }
      onEnded(ended);
    } catch (err) {
      setEndError(errorMessage(err));
      setEnding(false);
    }
  };

  const cameraOk = camera.status === "active";

  return (
    <div className="flex min-h-screen flex-col bg-ink-950 text-white">
      <header className="flex h-16 items-center justify-between gap-4 border-b border-white/10 px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Logo dark />
          <span className="hidden h-6 w-px bg-white/15 sm:block" />
          <span className="hidden text-xs font-semibold tracking-[0.16em] text-white/60 uppercase sm:block">Assessment</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/15 px-3 py-1.5 text-sm font-semibold text-rose-200 ring-1 ring-rose-400/30">
            <CircleDot className="size-3.5 animate-pulse text-rose-400" /> REC <span className="font-mono tabular-nums">{clock(elapsed)}</span>
          </span>
          <Button variant="danger" size="sm" icon={<Square className="size-3.5" />} onClick={() => setConfirmEnd(true)} disabled={ending}>
            End assessment
          </Button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4 sm:p-6">
        <div className="relative overflow-hidden rounded-3xl bg-black ring-1 ring-white/10">
          <div className="aspect-video">
            {cameraOk ? (
              <video ref={video} muted playsInline className="size-full -scale-x-100 object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <AlertTriangle className="size-8 text-amber-400" />
                <p className="font-semibold">Camera disconnected</p>
                <p className="max-w-md text-sm text-white/60">{camera.message ?? "Reconnect your camera."} The recording up to this point has been saved. You can end the assessment now.</p>
              </div>
            )}
          </div>
        </div>
        {recorder.error && <Alert tone={recorder.status === "error" ? "danger" : "warning"}>{recorder.error}</Alert>}
        {endError && <Alert tone="danger" title="The assessment could not be ended">{endError}</Alert>}
      </div>

      <Modal open={confirmEnd} onClose={() => setConfirmEnd(false)} title="End the assessment?"
        footer={<><Button variant="secondary" onClick={() => setConfirmEnd(false)}>Keep going</Button><Button variant="danger" onClick={end}>End assessment</Button></>}>
        <p className="text-sm text-ink-600">Recording will stop and your assessment will be submitted. You can't resume it afterwards.</p>
      </Modal>

      {ending && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-7 text-center text-ink-900 shadow-lift">
            <Spinner className="mx-auto size-8 text-brand-600" />
            <p className="mt-4 font-semibold">Submitting your assessment…</p>
            <p className="mt-1 text-sm text-ink-500">
              {recorder.pendingChunks > 0 ? `Uploading the last ${recorder.pendingChunks} part${recorder.pendingChunks > 1 ? "s" : ""} of the recording.` : "Finishing up."} Please keep this tab open.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
