import { CheckCircle2, Clock, FileVideo } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { LinkButton } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { duration } from "../../lib/format";
import type { Interview } from "../../types/api";

export function InterviewCompleted({ interview }: { interview: Interview }) {
  const recordingOk = interview.recording_status === "COMPLETE";
  return (
    <div className="mx-auto max-w-2xl py-6">
      <Card className="overflow-hidden text-center">
        <div className="bg-gradient-to-b from-teal-50 to-white px-8 pt-12 pb-8">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-teal-500 text-white shadow-[0_10px_30px_-10px_rgb(20_184_166/0.8)]">
            <CheckCircle2 className="size-8" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-ink-900">Assessment submitted</h1>
          <p className="mx-auto mt-2 max-w-md text-ink-500">Thank you. Your assessment has been recorded and submitted.</p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-ink-100 border-t border-ink-100">
          <Stat icon={<Clock className="size-4" />} label="Duration" value={duration(interview.duration_ms)} />
          <Stat icon={<FileVideo className="size-4" />} label="Recording" value={recordingOk ? "Saved" : "Not available"} />
        </div>
        <div className="space-y-4 border-t border-ink-100 px-8 py-8">
          {!recordingOk && (
            <Alert tone="warning" title="No recording was saved">Please contact support if you believe this is a mistake.</Alert>
          )}
          <LinkButton to="/dashboard" size="lg" variant="secondary">Back to dashboard</LinkButton>
        </div>
      </Card>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="px-4 py-5">
      <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-ink-400">{icon}{label}</p>
      <p className="mt-1 font-semibold text-ink-900">{value}</p>
    </div>
  );
}
