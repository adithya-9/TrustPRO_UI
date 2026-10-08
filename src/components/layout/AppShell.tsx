import { LogOut, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useLogout, useMe } from "../../hooks/useAuth";
import { cx } from "../../lib/format";
import { Logo } from "../ui/Logo";
import { useToast } from "../ui/Toast";

export function AppShell({ children, wide }: { children: ReactNode; wide?: boolean }) {
  const me = useMe();
  const logout = useLogout();
  const navigate = useNavigate();
  const toast = useToast();

  const signOut = () =>
    logout.mutate(undefined, {
      onSuccess: () => { toast.info("Signed out"); navigate("/"); },
      onError: () => navigate("/"),
    });

  const link = ({ isActive }: { isActive: boolean }) =>
    cx("rounded-lg px-3 py-2 text-sm font-medium transition", isActive ? "bg-ink-100 text-ink-900" : "text-ink-500 hover:text-ink-900");

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-40 border-b border-ink-200/70 bg-white/85 backdrop-blur-md">
        <div className={cx("mx-auto flex h-16 items-center justify-between gap-4 px-4 sm:px-6", wide ? "max-w-[1400px]" : "max-w-6xl")}>
          <div className="flex items-center gap-8">
            <Link to="/dashboard" aria-label="TrustPRO dashboard"><Logo /></Link>
            <nav className="hidden items-center gap-1 md:flex">
              <NavLink to="/dashboard" className={link}>Dashboard</NavLink>
              <NavLink to="/onboarding/profile" className={link}>Profile</NavLink>
              <NavLink to="/onboarding/id-verification" className={link}>ID verification</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-600 lg:inline-flex">
              <ShieldCheck className="size-3.5" /> Secure session
            </span>
            <span className="hidden max-w-[220px] truncate text-sm text-ink-500 sm:block">{me.data?.email}</span>
            <button onClick={signOut} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-100 hover:text-ink-900">
              <LogOut className="size-4" /> Sign out
            </button>
          </div>
        </div>
      </header>
      <main className={cx("mx-auto px-4 py-8 sm:px-6 sm:py-10", wide ? "max-w-[1400px]" : "max-w-6xl")}>{children}</main>
    </div>
  );
}
