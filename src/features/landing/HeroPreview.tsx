import { Camera, Eye, ScanFace, ShieldCheck, Users } from "lucide-react";

/** Illustrative product preview for the landing page (static, clearly not live data). */
export function HeroPreview() {
  const rows = [
    { icon: <Camera className="size-4" />, label: "Camera", value: "Active", tone: "text-teal-300" },
    { icon: <ScanFace className="size-4" />, label: "Identity", value: "Verified", tone: "text-teal-300" },
    { icon: <Users className="size-4" />, label: "Environment", value: "Monitoring", tone: "text-white/80" },
    { icon: <Eye className="size-4" />, label: "Gaze", value: "Looking Forward", tone: "text-white/80" },
  ];
  return (
    <figure className="relative mx-auto max-w-xl">
      <div className="rounded-[28px] bg-white/[0.06] p-3 ring-1 ring-white/15 backdrop-blur">
        <div className="flex items-center justify-between px-3 pt-1 pb-3">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-white/60 uppercase">
            <span className="size-2 animate-pulse rounded-full bg-rose-500" /> Live interview
          </div>
          <span className="rounded-full bg-white/10 px-2.5 py-1 font-mono text-xs text-white/70">12:48</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1.45fr_1fr]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-b from-[#1d2b52] to-[#0f1a38]">
            {/* abstract candidate silhouette */}
            <svg viewBox="0 0 200 150" className="absolute inset-0 size-full" aria-hidden="true">
              <defs>
                <linearGradient id="sil" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#4a5d92" />
                  <stop offset="1" stopColor="#2a3866" />
                </linearGradient>
              </defs>
              <circle cx="100" cy="62" r="25" fill="url(#sil)" />
              <path d="M48 150c4-30 26-46 52-46s48 16 52 46Z" fill="url(#sil)" />
              <rect x="70" y="32" width="60" height="64" rx="10" fill="none" stroke="#14b8a6" strokeWidth="1.4" strokeDasharray="4 3" />
            </svg>
            <div className="absolute inset-x-3 bottom-3 flex items-center justify-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-ink-950/70 px-3.5 py-1.5 text-xs font-semibold text-white ring-1 ring-white/15 backdrop-blur">
                <Eye className="size-3.5 text-teal-300" /> Looking Forward
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl bg-ink-950/50 p-3 ring-1 ring-white/10">
            <p className="px-1 pb-1 text-[11px] font-semibold tracking-[0.12em] text-white/45 uppercase">Monitoring</p>
            {rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between rounded-xl bg-white/[0.05] px-3 py-2.5">
                <span className="flex items-center gap-2 text-xs text-white/60">{r.icon}{r.label}</span>
                <span className={`text-xs font-semibold ${r.tone}`}>{r.value}</span>
              </div>
            ))}
            <div className="mt-auto flex items-center gap-2 rounded-xl bg-teal-500/10 px-3 py-2.5 text-xs text-teal-200 ring-1 ring-teal-400/20">
              <ShieldCheck className="size-4" /> ID verified before start
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-white/40">Product preview</figcaption>
    </figure>
  );
}
