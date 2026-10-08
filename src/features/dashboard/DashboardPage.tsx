import { ArrowRight, CheckCircle2, ChevronRight, FileBarChart2, IdCard, PlayCircle, UserRound, Video } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { errorMessage } from "../../api/client";
import { interviewApi } from "../../api/endpoints";
import { AppShell } from "../../components/layout/AppShell";
import { Alert, EmptyState } from "../../components/ui/Alert";
import { Badge, type Tone } from "../../components/ui/Badge";
import { Button, LinkButton } from "../../components/ui/Button";
import { Card, CardHeader } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Spinner";
import { useToast } from "../../components/ui/Toast";
import { useMe } from "../../hooks/useAuth";
import { cx, dateTime, duration } from "../../lib/format";
import type { Interview } from "../../types/api";

const STATUS: Record<Interview["status"], { label: string; tone: Tone }> = {
  CREATED: { label: "Not started", tone: "neutral" },
  LIVE: { label: "Interrupted", tone: "warning" },
  ENDED: { label: "Completed", tone: "success" },
  ABANDONED: { label: "Abandoned", tone: "neutral" },
};

export default function DashboardPage() {
  const me = useMe();
  const navigate = useNavigate();
  const toast = useToast();
  const interviews = useQuery({
    queryKey: ["interviews"],
    queryFn: interviewApi.list,
  });
  const create = useMutation({
    mutationFn: interviewApi.create,
    onSuccess: (iv) => navigate(`/interviews/${iv.interview_id}`),
    onError: (e) => toast.error("The assessment could not be started", errorMessage(e)),
  });

  const user = me.data!;
  const steps = [
    { icon: <UserRound className="size-4" />, title: "Candidate profile", done: user.profile_complete, to: "/onboarding/profile",
      text: user.profile_complete ? "Completed" : "Add your details and photos" },
    { icon: <IdCard className="size-4" />, title: "ID verification", done: user.id_captured, to: "/onboarding/id-verification",
      text: user.id_captured ? "ID details saved" : "Show your ID on camera" },
    { icon: <Video className="size-4" />, title: "Assessment", done: !!interviews.data?.some((i) => i.status === "ENDED"), to: null,
      text: "Video recorded" },
  ];
  const canInterview = user.next_step === "INTERVIEW";
  const pending = interviews.data?.find((i) => i.status === "CREATED");

  return (
    <AppShell>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-brand-600">Candidate dashboard</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink-900">Welcome to TrustPRO</h1>
          <p className="mt-1 text-ink-500">Complete the steps below, then start your assessment when you're ready.</p>
        </div>
        {canInterview ? (
          pending ? (
            <LinkButton to={`/interviews/${pending.interview_id}`} size="lg" icon={<PlayCircle className="size-5" />}>Continue to assessment</LinkButton>
          ) : (
            <Button size="lg" onClick={() => create.mutate()} loading={create.isPending} icon={<PlayCircle className="size-5" />}>Start assessment</Button>
          )
        ) : (
          <LinkButton to={user.next_step === "PROFILE" ? "/onboarding/profile" : "/onboarding/id-verification"} size="lg" trailingIcon={<ArrowRight className="size-4" />}>
            {user.next_step === "PROFILE" ? "Complete your profile" : "Verify your ID"}
          </LinkButton>
        )}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {steps.map((s, i) => (
          <Card key={s.title} className={cx("p-5", !s.done && i === steps.findIndex((x) => !x.done) && "ring-2 ring-brand-200")}>
            <div className="flex items-center justify-between">
              <span className={cx("grid size-9 place-items-center rounded-xl", s.done ? "bg-teal-50 text-teal-600" : "bg-ink-100 text-ink-500")}>{s.icon}</span>
              {s.done ? <CheckCircle2 className="size-5 text-teal-500" /> : <span className="text-xs font-semibold text-ink-400">Step {i + 1}</span>}
            </div>
            <p className="mt-4 font-semibold text-ink-900">{s.title}</p>
            <p className="mt-0.5 text-sm text-ink-500">{s.text}</p>
            {s.to && <Link to={s.to} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">{s.done ? "Review" : "Continue"}<ChevronRight className="size-4" /></Link>}
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader icon={<FileBarChart2 className="size-5" />} title="Your assessments" />
        {interviews.isPending ? (
          <div className="space-y-3 p-6">{[0, 1].map((i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : interviews.isError ? (
          <div className="p-6"><Alert tone="danger" title="Assessments could not be loaded">{errorMessage(interviews.error)}</Alert></div>
        ) : interviews.data.length === 0 ? (
          <EmptyState icon={<Video className="size-5" />} title="No assessments yet"
            description={canInterview ? "When you're ready, start your assessment. It is video recorded." : "Finish your profile and ID verification to unlock the assessment."} />
        ) : (
          <ul className="divide-y divide-ink-100">
            {interviews.data.map((iv) => <InterviewRow key={iv.interview_id} iv={iv} />)}
          </ul>
        )}
      </Card>
    </AppShell>
  );
}

function InterviewRow({ iv }: { iv: Interview }) {
  const s = STATUS[iv.status];
  return (
    <li className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="grid size-11 place-items-center rounded-xl bg-ink-100 text-ink-600"><Video className="size-5" /></div>
        <div>
          <p className="font-semibold text-ink-900">Assessment #{iv.interview_id}</p>
          <p className="text-sm text-ink-500">{dateTime(iv.started_at ?? iv.created_at)}{iv.duration_ms ? ` · ${duration(iv.duration_ms)}` : ""}</p>
        </div>
        <Badge tone={s.tone}>{s.label}</Badge>
      </div>
      <div className="flex items-center gap-3 sm:min-w-[300px] sm:justify-end">
        {iv.status === "CREATED" || iv.status === "LIVE" ? (
          <LinkButton to={`/interviews/${iv.interview_id}`} size="sm" variant="secondary">Open</LinkButton>
        ) : null}
      </div>
    </li>
  );
}
