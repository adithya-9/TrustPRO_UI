import { useEffect } from "react";
import { LogOut } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, errorMessage } from "../../api/client";
import { recruiterApi } from "../../api/endpoints";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Logo } from "../../components/ui/Logo";
import { PageLoader } from "../../components/ui/Spinner";
import { dateTime } from "../../lib/format";
import { RECRUITER_KEY, useRecruiter } from "./useRecruiter";

export default function RecruiterReportPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const me = useRecruiter();
  const report = useQuery({
    queryKey: ["recruiter", "report", me.data?.report_id],
    queryFn: recruiterApi.reportHtml,
    enabled: !!me.data,
    retry: false,
    staleTime: Infinity,
  });

  // Expired or signed out elsewhere: forget the login, which sends the page back to sign-in.
  const expired = report.error instanceof ApiError && report.error.status === 401;
  useEffect(() => { if (expired) qc.setQueryData(RECRUITER_KEY, null); }, [expired, qc]);

  if (me.isPending || expired) return <PageLoader />;
  if (!me.data) return <Navigate to="/recruiter/login" replace />;

  const signOut = async () => {
    await recruiterApi.logout().catch(() => undefined);
    qc.setQueryData(RECRUITER_KEY, null);
    qc.removeQueries({ queryKey: ["recruiter", "report"] });
    navigate("/recruiter/login", { replace: true });
  };

  return (
    <div className="flex h-screen flex-col bg-ink-50">
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-ink-100 bg-white px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Logo />
          <span className="hidden h-6 w-px bg-ink-200 sm:block" />
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-semibold text-ink-900">{me.data.candidate_name}</p>
            <p className="text-xs text-ink-500">Report {me.data.report_id} · access until {dateTime(me.data.expires_at)}</p>
          </div>
        </div>
        <Button variant="secondary" size="sm" icon={<LogOut className="size-4" />} onClick={signOut}>Sign out</Button>
      </header>
      {report.isPending ? (
        <PageLoader />
      ) : report.isError ? (
        <div className="mx-auto mt-10 w-full max-w-xl px-4">
          <Alert tone="danger" title="The report could not be opened">{errorMessage(report.error)}</Alert>
        </div>
      ) : (
        // The report is self-contained HTML from the server; sandboxed so it cannot run scripts.
        <iframe title="Candidate report" srcDoc={report.data} sandbox="" className="w-full flex-1 border-0 bg-white" />
      )}
    </div>
  );
}
