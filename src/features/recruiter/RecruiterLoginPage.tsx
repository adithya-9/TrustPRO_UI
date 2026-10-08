import { useState, type FormEvent } from "react";
import { Eye, EyeOff, FileCheck2, LockKeyhole } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { errorMessage } from "../../api/client";
import { recruiterApi } from "../../api/endpoints";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Field";
import { Logo } from "../../components/ui/Logo";
import { PageLoader } from "../../components/ui/Spinner";
import { RECRUITER_KEY, useRecruiter } from "./useRecruiter";

export default function RecruiterLoginPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const me = useRecruiter();
  // The emailed link carries the login in the URL fragment (#login=...&password=...), which the
  // browser never sends to a server. Read it once, then remove it from the address bar.
  const [prefill] = useState(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const values = { login: params.get("login") ?? "", password: params.get("password") ?? "" };
    if (values.login || values.password) window.history.replaceState(null, "", window.location.pathname);
    return values;
  });
  const [loginId, setLoginId] = useState(prefill.login);
  const [password, setPassword] = useState(prefill.password);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (me.isPending) return <PageLoader />;
  if (me.data) return <Navigate to="/recruiter/report" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!loginId.trim() || !password) { setError("Enter the login ID and password you were given."); return; }
    setBusy(true);
    try {
      qc.setQueryData(RECRUITER_KEY, await recruiterApi.login(loginId.trim(), password.trim()));
      navigate("/recruiter/report", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-ink-950 p-12 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -top-32 -left-24 size-[460px] rounded-full bg-brand-600/30 blur-[120px]" />
        <div className="pointer-events-none absolute right-0 bottom-0 size-[360px] rounded-full bg-teal-500/15 blur-[110px]" />
        <Logo dark className="relative" />
        <div className="relative mt-auto max-w-md">
          <h1 className="text-3xl leading-tight font-semibold">Candidate assessment report</h1>
          <ul className="mt-8 space-y-5 text-white/70">
            <li className="flex gap-3"><FileCheck2 className="mt-0.5 size-5 shrink-0 text-teal-300" />ID verification and environment observations for one candidate, with the frames they are based on.</li>
            <li className="flex gap-3"><LockKeyhole className="mt-0.5 size-5 shrink-0 text-teal-300" />This login opens only this candidate's report and stops working when it expires.</li>
          </ul>
        </div>
        <p className="relative mt-16 text-xs text-white/40">© {new Date().getFullYear()} Trustume</p>
      </aside>

      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md animate-fade-up">
          <Logo className="lg:hidden" />
          <h2 className="mt-8 text-2xl font-semibold text-ink-900 lg:mt-0">Recruiter sign in</h2>
          <p className="mt-2 text-ink-500">Use the login ID and password shared with you for this candidate.</p>

          <form onSubmit={submit} noValidate className="mt-8 space-y-5">
            {error && <Alert tone="danger">{error}</Alert>}
            <Field label="Login ID">
              {(id, d) => (
                <Input id={id} aria-describedby={d} autoComplete="username" value={loginId} autoFocus
                  onChange={(e) => setLoginId(e.target.value)} placeholder="rec-xxxxxxxx@trustpro.local" />
              )}
            </Field>
            <Field label="Password">
              {(id, d) => (
                <div className="relative">
                  <Input id={id} aria-describedby={d} type={showPassword ? "text" : "password"} autoComplete="current-password"
                    value={password} onChange={(e) => setPassword(e.target.value)} className="pr-11" />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 grid w-11 place-items-center text-ink-400 hover:text-ink-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              )}
            </Field>
            <Button type="submit" size="lg" className="w-full" loading={busy}>Open report</Button>
          </form>
        </div>
      </main>
    </div>
  );
}
