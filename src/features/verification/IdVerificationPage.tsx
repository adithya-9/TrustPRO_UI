import { useEffect, useRef, useState } from "react";
import { ArrowRight, Camera, CheckCircle2, CircleDashed, IdCard, RotateCcw, Save, ScanLine, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { errorMessage } from "../../api/client";
import { candidateApi, interviewApi } from "../../api/endpoints";
import { AppShell } from "../../components/layout/AppShell";
import { CameraStatusPanel } from "../../components/layout/CameraStatusPanel";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { Button, LinkButton } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Steps } from "../../components/ui/Progress";
import { PageLoader, Spinner } from "../../components/ui/Spinner";
import { useToast } from "../../components/ui/Toast";
import { ME_KEY, useMe } from "../../hooks/useAuth";
import { useCamera, useVideoStream } from "../../hooks/useCamera";
import { cx, dateOnly } from "../../lib/format";
import type { IdCapture } from "../../types/api";

/** The on-screen guide: centred, 72% of the frame width, ID-1 card proportions (85.6 x 54 mm). */
const GUIDE_WIDTH = 0.72;
const CARD_ASPECT = 85.6 / 54;
const CROP_PADDING = 0.06;

const instructions = [
  { icon: <ScanLine className="size-4" />, text: "Hold the ID inside the frame" },
  { icon: <IdCard className="size-4" />, text: "Make sure the complete ID is visible" },
  { icon: <CheckCircle2 className="size-4" />, text: "Make sure the text is readable" },
  { icon: <Sun className="size-4" />, text: "Avoid glare from lights or windows" },
  { icon: <CircleDashed className="size-4" />, text: "Keep the ID steady" },
  { icon: <Camera className="size-4" />, text: "Make sure your photo on the ID is visible" },
];

/** Crop the guide area from the full-resolution camera frame. The preview uses object-fit:
 *  cover, so the guide (drawn relative to the visible box) is mapped back to camera pixels. */
function captureGuideArea(video: HTMLVideoElement): Promise<Blob> {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const cw = video.clientWidth || vw;
  const ch = video.clientHeight || vh;
  const scale = Math.max(cw / vw, ch / vh);
  const visibleX = (vw - cw / scale) / 2;
  const visibleY = (vh - ch / scale) / 2;
  const gwScreen = cw * GUIDE_WIDTH;
  const ghScreen = Math.min(ch * 0.92, gwScreen / CARD_ASPECT);
  const gw = gwScreen / scale;
  const gh = ghScreen / scale;
  const pad = gw * CROP_PADDING;
  const x = Math.max(0, visibleX + (cw / scale - gw) / 2 - pad);
  const y = Math.max(0, visibleY + (ch / scale - gh) / 2 - pad);
  const w = Math.min(vw - x, gw + 2 * pad);
  const h = Math.min(vh - y, gh + 2 * pad);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w);
  canvas.height = Math.round(h);
  canvas.getContext("2d")!.drawImage(video, x, y, w, h, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Capture failed"))), "image/jpeg", 0.95));
}

export default function IdVerificationPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const me = useMe();
  const latest = useQuery({ queryKey: ["id-capture", "latest"], queryFn: candidateApi.latestCapture });
  const camera = useCamera({ width: 1920, height: 1080 });
  const video = useVideoStream(camera.stream);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [captured, setCaptured] = useState<IdCapture | null>(null);
  const [retaking, setRetaking] = useState(false);
  const timer = useRef<number | null>(null);
  const { start, stop } = camera;

  const profileIncomplete = me.data && !me.data.profile_complete;
  const shown = captured ?? (retaking ? null : latest.data ?? null);
  const showCamera = !profileIncomplete && !shown;
  useEffect(() => { if (showCamera) start(); else stop(); }, [showCamera, start, stop]);
  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); stop(); }, [stop]);

  const upload = useMutation({
    mutationFn: candidateApi.verifyId,
    onSuccess: (c) => {
      setCaptured(c);
      setRetaking(false);
      qc.setQueryData(["id-capture", "latest"], c);
      qc.invalidateQueries({ queryKey: ME_KEY });
    },
  });
  const save = useMutation({
    mutationFn: (c: IdCapture) => candidateApi.confirmId(c.verification_id),
    onSuccess: (c) => { setCaptured(c); qc.setQueryData(["id-capture", "latest"], c); qc.invalidateQueries({ queryKey: ME_KEY }); },
    onError: (e) => toast.error("The details could not be saved", errorMessage(e)),
  });
  const begin = useMutation({
    mutationFn: interviewApi.create,
    onSuccess: (iv) => navigate(`/interviews/${iv.interview_id}`),
    onError: (e) => toast.error("The assessment could not be started", errorMessage(e)),
  });

  const startCapture = () => {
    if (!video.current?.videoWidth) return;
    upload.reset();
    let n = 3;
    setCountdown(n);
    timer.current = window.setInterval(async () => {
      n -= 1;
      if (n > 0) { setCountdown(n); return; }
      window.clearInterval(timer.current!);
      setCountdown(null);
      try {
        upload.mutate(await captureGuideArea(video.current!));
      } catch {
        toast.error("The camera image could not be captured", "Please try again.");
      }
    }, 700);
  };

  if (me.isPending || latest.isPending) return <AppShell><PageLoader /></AppShell>;
  if (profileIncomplete) {
    return (
      <AppShell>
        <Alert tone="info" title="Complete your profile first" action={<LinkButton to="/onboarding/profile" size="sm">Go to profile</LinkButton>}>
          Your profile is needed before the ID check.
        </Alert>
      </AppShell>
    );
  }
  const busy = upload.isPending || countdown !== null;

  return (
    <AppShell>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Show your government ID</h1>
          <p className="mt-1 text-ink-500">Hold your ID up to the camera. We read your details from it for you to check.</p>
        </div>
        <Steps steps={["Profile", "ID verification", "Assessment"]} current={1} />
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="overflow-hidden">
          <div className="relative aspect-video overflow-hidden bg-ink-950">
            {shown ? (
              shown.capture_url ? <img src={shown.capture_url} alt="Captured ID" className="size-full object-contain" /> : null
            ) : camera.status === "active" ? (
              <>
                {/* Not mirrored: text on the ID reads normally on screen. */}
                <video ref={video} muted playsInline className="size-full object-cover" />
                <GuideOverlay />
                {countdown !== null && (
                  <div className="absolute inset-0 grid place-items-center bg-ink-950/25">
                    <div className="grid size-24 place-items-center rounded-full bg-ink-950/70 text-5xl font-semibold text-white ring-1 ring-white/20">{countdown}</div>
                  </div>
                )}
                {upload.isPending && (
                  <div className="absolute inset-0 grid place-items-center bg-ink-950/55 backdrop-blur-[2px]">
                    <div className="flex flex-col items-center gap-3 text-white"><Spinner className="size-8" /><p className="font-semibold">Reading your ID…</p></div>
                  </div>
                )}
                <div className="absolute top-4 left-4"><Badge tone="dark"><span className="size-1.5 rounded-full bg-teal-400" /> Camera on · not recording</Badge></div>
              </>
            ) : (
              <CameraStatusPanel status={camera.status} message={camera.message} onStart={camera.start} />
            )}
          </div>
          <div className="flex flex-col items-center justify-between gap-4 border-t border-ink-100 px-6 py-4 sm:flex-row">
            <p className="text-sm text-ink-500">
              {shown ? "The picture of your ID." : busy ? "Hold your ID steady…" : "Hold your ID inside the frame, then capture."}
            </p>
            {shown ? (
              <Button variant="secondary" onClick={() => { setCaptured(null); setRetaking(true); }} icon={<RotateCcw className="size-4" />}>Retake</Button>
            ) : (
              <Button onClick={startCapture} disabled={camera.status !== "active" || busy} loading={upload.isPending} icon={<Camera className="size-4" />}>
                Capture ID
              </Button>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          {upload.isError && <Alert tone="danger" title="The ID could not be read">{errorMessage(upload.error)}</Alert>}
          {shown ? (
            <Card className="p-6">
              <h2 className="font-semibold text-ink-900">{shown.confirmed ? "Your ID details are saved" : "Please check your details"}</h2>
              <p className="mt-1 text-sm text-ink-500">
                {shown.confirmed ? "You can start the assessment now." : "We read these details from your ID. Save them if they are correct, or retake the picture."}
              </p>
              <div className="mt-5 flex gap-4">
                <div className="h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-ink-100 ring-1 ring-ink-200">
                  {shown.portrait_url ? <img src={shown.portrait_url} alt="Photo on the ID" className="size-full object-cover" />
                    : <div className="grid size-full place-items-center p-2 text-center text-xs text-ink-500">No photo found</div>}
                </div>
                <dl className="min-w-0 flex-1 space-y-2.5 text-sm">
                  {([["Name", shown.details.name], ["ID", shown.details.id_number ? `${shown.details.id_number}${shown.details.id_type ? ` (${shown.details.id_type})` : ""}` : null],
                     ["DOB", shown.details.dob ? (shown.details.dob.length === 4 ? shown.details.dob : dateOnly(shown.details.dob)) : null]] as [string, string | null][]).map(([k, v]) => (
                    <div key={k} className="flex gap-3">
                      <dt className="w-12 shrink-0 text-ink-500">{k}:</dt>
                      <dd className={cx("min-w-0 font-semibold break-words", v ? "text-ink-900" : "text-amber-600")}>{v ?? "Could not read"}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              {shown.confirmed ? (
                <Button className="mt-6 w-full" size="lg" onClick={() => begin.mutate()} loading={begin.isPending} trailingIcon={<ArrowRight className="size-4" />}>
                  Start assessment
                </Button>
              ) : (
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Button variant="secondary" onClick={() => { setCaptured(null); setRetaking(true); }} icon={<RotateCcw className="size-4" />}>Retake</Button>
                  <Button onClick={() => save.mutate(shown)} loading={save.isPending} icon={<Save className="size-4" />}>Save</Button>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-6">
              <h2 className="font-semibold text-ink-900">Before you capture</h2>
              <ul className="mt-4 space-y-3">
                {instructions.map((i) => (
                  <li key={i.text} className="flex items-center gap-3 text-sm text-ink-700">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">{i.icon}</span>{i.text}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function GuideOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="relative rounded-2xl border-2 border-white/85 shadow-[0_0_0_9999px_rgb(10_20_48/0.45)]"
        style={{ width: `${GUIDE_WIDTH * 100}%`, aspectRatio: `${CARD_ASPECT}`, maxHeight: "92%" }}>
        {["top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl", "top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl",
          "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl", "bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl"].map((c) => (
          <span key={c} className={cx("absolute -m-0.5 size-8 border-white", c)} />
        ))}
        <span className="absolute -top-9 left-1/2 -translate-x-1/2 rounded-full bg-ink-950/70 px-3 py-1 text-xs font-medium whitespace-nowrap text-white">
          Place your ID inside this frame
        </span>
      </div>
    </div>
  );
}
