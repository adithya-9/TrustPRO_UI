import { useEffect, useRef, useState, type ReactNode } from "react";
import { Camera, ImagePlus, RefreshCw } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { CameraStatusPanel } from "../../components/layout/CameraStatusPanel";
import { useCamera, useVideoStream } from "../../hooks/useCamera";
import { cx } from "../../lib/format";

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

export function validateImage(file: File): string | null {
  if (!ACCEPT.includes(file.type)) return "Choose a JPEG, PNG or WebP image.";
  if (file.size > MAX_BYTES) return "The image is larger than 8 MB.";
  return null;
}

/** Image picker with preview, drag & drop, and (optionally) a webcam capture. */
export function PhotoInput({ label, description, existingUrl, file, onChange, error, allowCamera, aspect = "square", icon }: {
  label: string; description: string; existingUrl: string | null; file: File | null;
  onChange: (file: File | null, error: string | null) => void; error?: string; allowCamera?: boolean;
  aspect?: "square" | "card"; icon: ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (f: File | undefined) => {
    if (!f) return;
    onChange(f, validateImage(f));
  };
  const shown = preview ?? existingUrl;

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-ink-800">{label} <span className="text-rose-600">*</span></p>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files[0]); }}
        className={cx(
          "relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed text-center transition",
          aspect === "square" ? "aspect-[4/3]" : "aspect-[1.586/1]",
          dragging ? "border-brand-500 bg-brand-50" : error ? "border-rose-300 bg-rose-50/40" : "border-ink-200 bg-ink-50/60 hover:border-ink-300",
        )}
      >
        {shown ? (
          <>
            <img src={shown} alt={label} className="absolute inset-0 size-full object-contain bg-ink-900/[0.03]" />
            <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2 bg-gradient-to-t from-ink-950/70 to-transparent p-3 pt-10">
              <Button size="sm" variant="light" onClick={() => input.current?.click()} icon={<RefreshCw className="size-3.5" />} type="button">Replace</Button>
              {allowCamera && <Button size="sm" variant="light" onClick={() => setCameraOpen(true)} icon={<Camera className="size-3.5" />} type="button">Retake</Button>}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center px-6">
            <div className="grid size-12 place-items-center rounded-2xl bg-white text-brand-600 shadow-card ring-1 ring-ink-200">{icon}</div>
            <p className="mt-3 text-sm font-medium text-ink-800">Drop an image here</p>
            <p className="mt-1 text-xs text-ink-500">{description}</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="secondary" type="button" onClick={() => input.current?.click()} icon={<ImagePlus className="size-4" />}>Upload</Button>
              {allowCamera && <Button size="sm" variant="secondary" type="button" onClick={() => setCameraOpen(true)} icon={<Camera className="size-4" />}>Use camera</Button>}
            </div>
          </div>
        )}
        <input ref={input} type="file" accept={ACCEPT.join(",")} className="sr-only" tabIndex={-1}
          onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} aria-label={label} />
      </div>
      {error && <p className="mt-1.5 text-sm text-rose-600">{error}</p>}
      {allowCamera && (
        <SelfieModal open={cameraOpen} onClose={() => setCameraOpen(false)}
          onCapture={(f) => { setCameraOpen(false); onChange(f, null); }} />
      )}
    </div>
  );
}

function SelfieModal({ open, onClose, onCapture }: { open: boolean; onClose: () => void; onCapture: (f: File) => void }) {
  const camera = useCamera({ width: 1280, height: 960 });
  const video = useVideoStream(camera.stream);
  const { start, stop } = camera;

  useEffect(() => {
    if (open) start(); else stop();
  }, [open, start, stop]);

  const capture = () => {
    const el = video.current;
    if (!el || !el.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = el.videoWidth;
    canvas.height = el.videoHeight;
    canvas.getContext("2d")!.drawImage(el, 0, 0);
    canvas.toBlob((blob) => blob && onCapture(new File([blob], "profile-photo.jpg", { type: "image/jpeg" })), "image/jpeg", 0.92);
  };

  return (
    <Modal open={open} onClose={onClose} title="Take a profile photo" size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={capture} disabled={camera.status !== "active"} icon={<Camera className="size-4" />}>Capture photo</Button></>}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-ink-950">
        {camera.status === "active" ? (
          <>
            <video ref={video} muted playsInline className="size-full -scale-x-100 object-cover" />
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="h-[72%] w-[46%] rounded-[50%] border-2 border-dashed border-white/70" />
            </div>
          </>
        ) : (
          <CameraStatusPanel status={camera.status} message={camera.message} onStart={camera.start} />
        )}
      </div>
      <p className="mt-3 text-sm text-ink-500">Face the camera in good light, with your whole face inside the oval. Remove sunglasses or hats.</p>
    </Modal>
  );
}
