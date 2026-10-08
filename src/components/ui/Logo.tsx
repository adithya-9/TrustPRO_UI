import { cx } from "../../lib/format";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cx("size-8", className)} aria-hidden="true">
      <defs>
        <linearGradient id="tp-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b6cf6" />
          <stop offset="1" stopColor="#14b8a6" />
        </linearGradient>
      </defs>
      <path d="M16 2 4 6.5v8.6C4 22.6 9.1 28.4 16 30c6.9-1.6 12-7.4 12-14.9V6.5L16 2Z" fill="url(#tp-g)" />
      <path d="m10.5 16.2 3.8 3.8 7.4-7.6" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ dark, className }: { dark?: boolean; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className={cx("text-[17px] font-bold tracking-tight", dark ? "text-white" : "text-ink-900")}>
          Trust<span className="text-brand-500">PRO</span>
        </span>
        <span className={cx("mt-1 text-[10px] font-medium tracking-[0.12em] uppercase", dark ? "text-white/55" : "text-ink-400")}>
          by Trustume
        </span>
      </span>
    </span>
  );
}
