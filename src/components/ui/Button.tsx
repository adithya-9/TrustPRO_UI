import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { cx } from "../../lib/format";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "light";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 " +
  "disabled:cursor-not-allowed disabled:opacity-55 select-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white shadow-[0_1px_0_rgb(255_255_255/0.15)_inset,0_6px_16px_-6px_rgb(42_85_230/0.6)] " +
    "hover:bg-brand-700 active:translate-y-px",
  secondary: "bg-white text-ink-800 ring-1 ring-ink-200 hover:bg-ink-50 hover:ring-ink-300 active:translate-y-px",
  ghost: "text-ink-700 hover:bg-ink-100",
  danger: "bg-rose-600 text-white hover:bg-rose-700 active:translate-y-px",
  light: "bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/15 backdrop-blur",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-13 px-7 text-base",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", loading, icon, trailingIcon, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner className="size-4" /> : icon}
      {children}
      {!loading && trailingIcon}
    </button>
  );
});

interface LinkButtonProps extends LinkProps {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
}

export function LinkButton({ variant = "primary", size = "md", icon, trailingIcon, className, children, ...rest }: LinkButtonProps) {
  return (
    <Link className={cx(base, variants[variant], sizes[size], className)} {...rest}>
      {icon}
      {children}
      {trailingIcon}
    </Link>
  );
}
