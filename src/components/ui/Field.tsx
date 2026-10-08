import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { cx } from "../../lib/format";

const control =
  "block w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-[15px] text-ink-900 shadow-sm ring-1 ring-inset " +
  "ring-ink-200 placeholder:text-ink-400 transition focus:ring-2 focus:ring-brand-500 focus:outline-none";

interface FieldProps {
  label: string;
  hint?: ReactNode;
  error?: string;
  children: (id: string, describedBy: string | undefined) => ReactNode;
}

export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-800">{label}</label>
      {children(id, describedBy)}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-rose-600">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-[13px] text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function Input({ className, invalid, ...rest }, ref) {
    return <input ref={ref} className={cx(control, invalid && "ring-rose-400 focus:ring-rose-500", className)} aria-invalid={invalid || undefined} {...rest} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(
  function Select({ className, invalid, children, ...rest }, ref) {
    return (
      <select ref={ref} className={cx(control, "appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10", invalid && "ring-rose-400", className)}
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2367728f' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
        aria-invalid={invalid || undefined} {...rest}>
        {children}
      </select>
    );
  },
);
