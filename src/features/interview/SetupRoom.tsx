import { useEffect, useRef, useState } from "react";
import { ArrowRight, Camera, CheckCircle2, CircleDashed, Mic, ScanFace, Sun, Users, XCircle } from "lucide-react";
import { errorMessage } from "../../api/client";
import { interviewApi } from "../../api/endpoints";
import { AppShell } from "../../components/layout/AppShell";
import { CameraStatusPanel } from "../../components/layout/CameraStatusPanel";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Steps } from "../../components/ui/Progress";
import { frameBrightness, useCamera, useVideoStream } from "../../hooks/useCamera";
import { pickMimeType } from "../../hooks/useRecorder";
import { cx } from "../../lib/format";
import type { Interview } from "../../types/api";

type CameraApi = ReturnType<typeof useCamera>;

function useMicLevel(stream: MediaStream | null) {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    if (!stream || !stream.getAudioTracks().length) return;
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const data = new Uint8Array(analyser.fftSize);
    let raf = 0;
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let peak = 0;
      for (const v of data) peak = Math.max(peak, Math.abs(v - 128));
      setLevel((prev) => prev * 0.7 + (peak / 128) * 0.3);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); ctx.close(); };
  }, [stream]);
  return level;
}

export function SetupRoom({ interview, camera, onStarted }: {
  interview: Interview; camera: CameraApi; onStarted: (i: Interview) => void;
}) {
  const video = useVideoStream(camera.stream);
  const level = useMicLevel(camera.stream);
  const [brightness, setBrightness] = useState<number | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heardSound, setHeardSound] = useState(false);
  const started = useRef(false);
  const { start } = camera;

  useEffect(() => { if (!started.current) { started.current = true; start(); } }, [start]);
  useEffect(() => { if (level > 0.08) setHeardSound(true); }, [level]);
  useEffect(() => {
    if (camera.status !== "active") return;
    const t = window.setInterval(() => video.current && setBrightness(frameBrightness(video.current)), 1000);
    return () => window.clearInterval(t);
  }, [camera.status, video]);

  const recordable = !!pickMimeType();
  const lightingOk = brightness == null ? null : brightness >= 55;
  const ready = camera.status === "active" && camera.hasAudio && recordable;

  const begin = async () => {
    setError(null);
    setStarting(true);
    try {
      onStarted(await interviewApi.start(interview.interview_id));
    } catch (err) {
      setError(errorMessage(err));
      setStarting(false);
    }
  };

  const check = (ok: boolean | null, label: string, detail: string, icon: React.ReactNode) => (
    <li className="flex items-start gap-3 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ink-50 text-ink-600">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink-800">{label}</p>
        <p className="text-xs text-ink-500">{detail}</p>
      </div>
      {ok === true ? <CheckCircle2 className="size-5 text-teal-500" /> : ok === false ? <XCircle className="size-5 text-amber-500" /> : <CircleDashed className="size-5 text-ink-300" />}
    </li>
  );

  return (
    <AppShell>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Get ready for your assessment</h1>
          <p className="mt-1 text-ink-500">Check your camera, microphone and lighting. Recording starts only when you press Start.</p>
        </div>
        <Steps steps={["Profile", "ID verification", "Assessment"]} current={2} />
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="overflow-hidden">
          <div className="relative aspect-video bg-ink-950">
            {camera.status === "active" ? (
              <>
                <video ref={video} muted playsInline className="size-full -scale-x-100 object-cover" />
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="h-[70%] w-[34%] rounded-[50%] border-2 border-dashed border-white/50" />
                </div>
                <div className="absolute top-4 left-4"><Badge tone="dark">Preview · not recording</Badge></div>
              </>
            ) : (
              <CameraStatusPanel status={camera.status} message={camera.message} onStart={camera.start} />
            )}
          </div>
          <div className="border-t border-ink-100 px-6 py-4 text-sm text-ink-500">
            Sit centred with your face inside the oval, at a comfortable distance from the screen.
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-semibold text-ink-900">Device check</h2>
            <ul className="mt-2 divide-y divide-ink-100">
              {check(camera.status === "active" ? true : camera.status === "requesting" || camera.status === "idle" ? null : false,
                "Camera", camera.status === "active" ? "Working" : camera.message ?? "Waiting for permission", <Camera className="size-4" />)}
              {check(camera.status !== "active" ? null : camera.hasAudio ? (heardSound ? true : null) : false, "Microphone",
                !camera.hasAudio ? "Not available" : heardSound ? "Working - we can hear you" : "Say something to test it", <Mic className="size-4" />)}
              {check(lightingOk, "Lighting", lightingOk == null ? "Checking…" : lightingOk ? "Good" : "Too dark - face a window or turn on a light", <Sun className="size-4" />)}
              {check(recordable ? true : false, "Browser recording", recordable ? "Supported" : "Not supported - use Chrome, Edge or Firefox", <CircleDashed className="size-4" />)}
            </ul>
            {camera.hasAudio && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-100" aria-hidden="true">
                <div className="h-full rounded-full bg-teal-500 transition-[width] duration-100" style={{ width: `${Math.min(100, level * 260)}%` }} />
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-ink-900">During the assessment</h2>
            <ul className="mt-4 space-y-3 text-sm text-ink-600">
              <li className="flex gap-3"><ScanFace className="mt-0.5 size-4 shrink-0 text-brand-500" />Sit in a quiet, well-lit place and keep your face in view.</li>
              <li className="flex gap-3"><Users className="mt-0.5 size-4 shrink-0 text-brand-500" />Video and audio are recorded until you end the assessment.</li>
            </ul>
          </Card>

          {error && <Alert tone="danger" title="The assessment could not start">{error}</Alert>}
          {camera.status === "active" && !camera.hasAudio && (
            <Alert tone="warning" title="Microphone needed">Connect a microphone and allow access, then press “Try again” on the camera.</Alert>
          )}
          <Button size="lg" className={cx("w-full")} disabled={!ready} loading={starting} onClick={begin} trailingIcon={<ArrowRight className="size-4" />}>
            Start assessment
          </Button>
          <p className="text-center text-xs text-ink-400">By starting, you agree to video and audio recording for this assessment.</p>
        </div>
      </div>
    </AppShell>
  );
}
