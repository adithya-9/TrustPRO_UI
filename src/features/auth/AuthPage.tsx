import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LockKeyhole, ScanFace, ShieldCheck } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError, errorMessage } from "../../api/client";
import { authApi } from "../../api/endpoints";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Field";
import { Logo } from "../../components/ui/Logo";
import { PageLoader } from "../../components/ui/Spinner";
import { ME_KEY, STEP_PATH, useMe } from "../../hooks/useAuth";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const isLogin = mode === "login";
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const me = useMe();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  if (me.isPending) return <PageLoader />;
  if (me.data) return <Navigate to={STEP_PATH[me.data.next_step]} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFields({});
    const local: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) local.email = "Enter a valid email address.";
    if (!password) local.password = "Enter your password.";
    else if (!isLogin && (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)))
      local.password = "Use at least 8 characters with a letter and a number.";
    if (Object.keys(local).length) { setFields(local); return; }

    setBusy(true);
    try {
      const user = isLogin ? await authApi.login(email.trim(), password) : await authApi.register(email.trim(), password);
      qc.setQueryData(ME_KEY, user);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from !== "/" ? from : STEP_PATH[user.next_step], { replace: true });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) setFields(err.fields);
      else setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-ink-950 p-12 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -top-32 -left-24 size-[460px] rounded-full bg-brand-600/30 blur-[120px]" />
        <div className="pointer-events-none absolute right-0 bottom-0 size-[360px] rounded-full bg-teal-500/15 blur-[110px]" />
        <Link to="/" className="relative"><Logo dark /></Link>
        <div className="relative mt-auto max-w-md">
          <h1 className="text-3xl leading-tight font-semibold">A fair, verified interview for every candidate.</h1>
          <ul className="mt-8 space-y-5 text-white/70">
            <li className="flex gap-3"><ScanFace className="mt-0.5 size-5 shrink-0 text-teal-300" />Your ID is checked on camera before the interview, so your identity is confirmed up front.</li>
            <li className="flex gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-teal-300" />Monitoring reports observations with evidence. It never makes automated decisions about you.</li>
            <li className="flex gap-3"><LockKeyhole className="mt-0.5 size-5 shrink-0 text-teal-300" />Your password and ID number are never stored in readable form.</li>
          </ul>
        </div>
        <p className="relative mt-16 text-xs text-white/40">© {new Date().getFullYear()} Trustume</p>
      </aside>

      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md animate-fade-up">
          <Link to="/" className="lg:hidden"><Logo /></Link>
          <h2 className="mt-8 text-2xl font-semibold text-ink-900 lg:mt-0">{isLogin ? "Sign in to TrustPRO" : "Create your candidate account"}</h2>
          <p className="mt-2 text-ink-500">
            {isLogin ? "Continue to your interview setup." : "You'll set up your profile and verify your ID next."}
          </p>

          <form onSubmit={submit} noValidate className="mt-8 space-y-5">
            {error && <Alert tone="danger">{error}</Alert>}
            <Field label="Email" error={fields.email}>
              {(id, d) => (
                <Input id={id} aria-describedby={d} type="email" autoComplete="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} invalid={!!fields.email} placeholder="you@example.com" autoFocus />
              )}
            </Field>
            <Field label="Password" error={fields.password} hint={!isLogin ? "At least 8 characters, including a letter and a number." : undefined}>
              {(id, d) => (
                <div className="relative">
                  <Input id={id} aria-describedby={d} type={showPassword ? "text" : "password"}
                    autoComplete={isLogin ? "current-password" : "new-password"} value={password}
                    onChange={(e) => setPassword(e.target.value)} invalid={!!fields.password} className="pr-11" />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 grid w-11 place-items-center text-ink-400 hover:text-ink-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              )}
            </Field>
            <Button type="submit" size="lg" className="w-full" loading={busy}>
              {isLogin ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            {isLogin ? "New to TrustPRO? " : "Already have an account? "}
            <Link to={isLogin ? "/register" : "/login"} state={location.state} className="font-semibold text-brand-600 hover:text-brand-700">
              {isLogin ? "Create an account" : "Sign in"}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
