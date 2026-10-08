import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cx } from "../../lib/format";

type Tone = "info" | "success" | "warning" | "danger";

const styles: Record<Tone, { box: string; icon: ReactNode }> = {
  info: { box: "bg-brand-50 text-brand-700 ring-brand-100", icon: <Info className="size-5" /> },
  success: { box: "bg-teal-50 text-teal-600 ring-teal-100", icon: <CheckCircle2 className="size-5" /> },
  warning: { box: "bg-amber-50 text-amber-700 ring-amber-100", icon: <AlertTriangle className="size-5" /> },
  danger: { box: "bg-rose-50 text-rose-700 ring-rose-100", icon: <XCircle className="size-5" /> },
};

export function Alert({ tone = "info", title, children, action, className }: {
  tone?: Tone; title?: ReactNode; children?: ReactNode; action?: ReactNode; className?: string;
}) {
  const s = styles[tone];
  return (
    <div role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      className={cx("flex gap-3 rounded-xl px-4 py-3.5 ring-1 ring-inset", s.box, className)}>
      <div className="mt-0.5 shrink-0">{s.icon}</div>
      <div className="min-w-0 flex-1 text-sm leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cx(title ? "mt-0.5" : "", "opacity-90")}>{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: {
  icon: ReactNode; title: string; description?: ReactNode; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-ink-100 text-ink-500">{icon}</div>
      <p className="mt-4 font-semibold text-ink-800">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
