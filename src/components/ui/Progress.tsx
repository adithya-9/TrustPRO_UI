import { cx } from "../../lib/format";

export function ProgressBar({ value, className, tone = "brand", label }: {
  value: number; className?: string; tone?: "brand" | "teal" | "amber"; label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const fill = { brand: "bg-brand-500", teal: "bg-teal-500", amber: "bg-amber-500" }[tone];
  return (
    <div className={cx("h-2 w-full overflow-hidden rounded-full bg-ink-100", className)}
      role="progressbar" aria-valuenow={Math.round(clamped)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={cx("h-full rounded-full transition-[width] duration-500 ease-out", fill)} style={{ width: `${clamped}%` }} />
    </div>
  );
}

export function Steps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center gap-2 text-sm" aria-label="Progress">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step} className="flex items-center gap-2">
            <span className={cx(
              "grid size-6 place-items-center rounded-full text-xs font-semibold transition",
              done && "bg-teal-500 text-white",
              active && "bg-brand-600 text-white ring-4 ring-brand-100",
              !done && !active && "bg-ink-100 text-ink-500",
            )} aria-current={active ? "step" : undefined}>
              {done ? "✓" : i + 1}
            </span>
            <span className={cx("hidden font-medium whitespace-nowrap sm:inline", active ? "text-ink-900" : "text-ink-500")}>{step}</span>
            {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-ink-200 sm:w-10" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
