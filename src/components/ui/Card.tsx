import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "../../lib/format";

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("rounded-2xl bg-white shadow-card ring-1 ring-ink-200/70", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action, icon }: {
  title: ReactNode; description?: ReactNode; action?: ReactNode; icon?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-6 py-5">
      <div className="flex items-start gap-3">
        {icon && <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">{icon}</div>}
        <div>
          <h3 className="text-[15px] font-semibold text-ink-900">{title}</h3>
          {description && <p className="mt-0.5 text-sm text-ink-500">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function SectionTitle({ eyebrow, title, description, className }: {
  eyebrow?: string; title: ReactNode; description?: ReactNode; className?: string;
}) {
  return (
    <div className={className}>
      {eyebrow && <p className="text-xs font-semibold tracking-[0.14em] text-brand-600 uppercase">{eyebrow}</p>}
      <h2 className="mt-1.5 text-2xl font-semibold text-ink-900">{title}</h2>
      {description && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-500">{description}</p>}
    </div>
  );
}
