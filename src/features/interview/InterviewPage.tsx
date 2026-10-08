import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { errorMessage } from "../../api/client";
import { interviewApi } from "../../api/endpoints";
import { AppShell } from "../../components/layout/AppShell";
import { Alert } from "../../components/ui/Alert";
import { LinkButton } from "../../components/ui/Button";
import { PageLoader } from "../../components/ui/Spinner";
import { useCamera } from "../../hooks/useCamera";
import type { Interview } from "../../types/api";
import { InterviewCompleted } from "./InterviewCompleted";
import { InterruptedInterview } from "./InterruptedInterview";
import { LiveRoom } from "./LiveRoom";
import { SetupRoom } from "./SetupRoom";

type Phase = "setup" | "live" | "completed";

export default function InterviewPage() {
  const id = Number(useParams().interviewId);
  const qc = useQueryClient();
  const interview = useQuery({ queryKey: ["interview", id], queryFn: () => interviewApi.get(id), enabled: Number.isFinite(id) });
  const camera = useCamera({ audio: true, width: 1280, height: 720 });
  const [phase, setPhase] = useState<Phase | null>(null);
  const [live, setLive] = useState<Interview | null>(null);

  // Decide the starting phase once, from the server state.
  useEffect(() => {
    if (!interview.data || phase) return;
    if (interview.data.status === "CREATED") setPhase("setup");
    else if (interview.data.status === "ENDED") setPhase("completed");
  }, [interview.data, phase]);

  if (!Number.isFinite(id)) return <AppShell><Alert tone="danger">This interview link is not valid.</Alert></AppShell>;
  if (interview.isPending) return <AppShell><PageLoader label="Preparing your interview" /></AppShell>;
  if (interview.isError) {
    return (
      <AppShell>
        <Alert tone="danger" title="The interview could not be loaded" action={<LinkButton to="/dashboard" size="sm" variant="secondary">Dashboard</LinkButton>}>
          {errorMessage(interview.error)}
        </Alert>
      </AppShell>
    );
  }

  const data = interview.data;
  if (phase === "live" && live) {
    return (
      <LiveRoom interview={live} camera={camera}
        onEnded={(ended) => { qc.setQueryData(["interview", id], ended); camera.stop(); setPhase("completed"); }} />
    );
  }
  if (phase === "completed" || data.status === "ENDED") {
    return <AppShell><InterviewCompleted interview={qc.getQueryData<Interview>(["interview", id]) ?? data} /></AppShell>;
  }
  if (data.status === "LIVE") {
    return <AppShell><InterruptedInterview interview={data} onEnded={(ended) => { qc.setQueryData(["interview", id], ended); setPhase("completed"); }} /></AppShell>;
  }
  return (
    <SetupRoom interview={data} camera={camera}
      onStarted={(started) => { setLive(started); setPhase("live"); }} />
  );
}
