import { AlertTriangle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { errorMessage } from "../../api/client";
import { interviewApi } from "../../api/endpoints";
import { Alert } from "../../components/ui/Alert";
import { Button, LinkButton } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import type { Interview } from "../../types/api";

/** Shown when a live interview page is reopened (refresh, closed tab): recording cannot resume,
 *  but everything uploaded so far can be kept. */
export function InterruptedInterview({ interview, onEnded }: { interview: Interview; onEnded: (i: Interview) => void }) {
  const end = useMutation({
    mutationFn: () => {
      const started = interview.started_at ? new Date(interview.started_at).getTime() : Date.now();
      return interviewApi.end(interview.interview_id, Math.max(0, Date.now() - started), interview.recording_chunks);
    },
    onSuccess: onEnded,
  });
  return (
    <Card className="mx-auto max-w-xl p-8 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-50 text-amber-600"><AlertTriangle className="size-6" /></div>
      <h1 className="mt-5 text-xl font-semibold text-ink-900">This interview was interrupted</h1>
      <p className="mt-2 text-ink-500">
        The page was closed or reloaded during the interview. Recording can't be resumed, but everything recorded until then has been saved.
      </p>
      {end.isError && <Alert tone="danger" className="mt-5 text-left">{errorMessage(end.error)}</Alert>}
      <div className="mt-7 flex justify-center gap-3">
        <LinkButton to="/dashboard" variant="secondary">Back to dashboard</LinkButton>
        <Button onClick={() => end.mutate()} loading={end.isPending} disabled={interview.recording_chunks === 0}>Finish with saved recording</Button>
      </div>
    </Card>
  );
}
