import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cx } from "../../lib/format";

type ToastTone = "info" | "success" | "warning" | "danger";
interface ToastItem { id: number; tone: ToastTone; title: string; description?: string }

interface ToastApi {
  show: (tone: ToastTone, title: string, description?: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const icons: Record<ToastTone, ReactNode> = {
  info: <Info className="size-5 text-brand-500" />,
  success: <CheckCircle2 className="size-5 text-teal-500" />,
  warning: <AlertTriangle className="size-5 text-amber-500" />,
  danger: <XCircle className="size-5 text-rose-600" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const next = useRef(1);

  const dismiss = useCallback((id: number) => setItems((all) => all.filter((t) => t.id !== id)), []);
  const show = useCallback((tone: ToastTone, title: string, description?: string) => {
    const id = next.current++;
    setItems((all) => [...all.slice(-3), { id, tone, title, description }]);
    window.setTimeout(() => dismiss(id), tone === "danger" ? 7000 : 4500);
  }, [dismiss]);

  const api = useMemo<ToastApi>(() => ({
    show,
    success: (t, d) => show("success", t, d),
    error: (t, d) => show("danger", t, d),
    info: (t, d) => show("info", t, d),
  }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="no-print pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={cx("pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-xl bg-white p-4 shadow-lift ring-1 ring-ink-200")}>
            {icons[t.tone]}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink-900">{t.title}</p>
              {t.description && <p className="mt-0.5 text-sm text-ink-500">{t.description}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="rounded-md p-0.5 text-ink-400 hover:text-ink-700" aria-label="Dismiss notification">
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
