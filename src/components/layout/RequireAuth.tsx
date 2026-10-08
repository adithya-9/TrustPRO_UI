import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useMe } from "../../hooks/useAuth";
import { errorMessage } from "../../api/client";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { PageLoader } from "../ui/Spinner";

export function RequireAuth({ children }: { children: ReactNode }) {
  const me = useMe();
  const location = useLocation();
  if (me.isPending) return <PageLoader label="Checking your session" />;
  if (me.isError) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24">
        <Alert tone="danger" title="TrustPRO is not reachable" action={<Button size="sm" variant="secondary" onClick={() => me.refetch()}>Retry</Button>}>
          {errorMessage(me.error)}
        </Alert>
      </div>
    );
  }
  if (!me.data) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}
