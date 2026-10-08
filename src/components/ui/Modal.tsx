import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cx } from "../../lib/format";

/** Accessible dialog built on the native <dialog> element (focus trap and Esc handling included). */
export function Modal({ open, onClose, title, children, footer, size = "md" }: {
  open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode;
  size?: "md" | "lg" | "xl";
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      className={cx(
        "m-auto w-[calc(100%-2rem)] rounded-2xl bg-white p-0 text-ink-900 shadow-lift backdrop:bg-ink-950/50 backdrop:backdrop-blur-sm",
        size === "md" && "max-w-md", size === "lg" && "max-w-2xl", size === "xl" && "max-w-4xl",
      )}
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-ink-100 px-6 py-4">
            <h2 className="text-base font-semibold">{title}</h2>
            <button onClick={onClose} className="rounded-lg p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700" aria-label="Close">
              <X className="size-5" />
            </button>
          </div>
          <div className="overflow-y-auto px-6 py-5">{children}</div>
          {footer && <div className="flex justify-end gap-3 border-t border-ink-100 bg-ink-50/60 px-6 py-4">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}
