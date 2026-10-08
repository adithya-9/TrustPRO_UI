import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./components/layout/RequireAuth";
import { PageLoader } from "./components/ui/Spinner";
import { LandingPage } from "./features/landing/LandingPage";
import { AuthPage } from "./features/auth/AuthPage";

// Heavier screens load on demand so the landing page stays fast.
const DashboardPage = lazy(() => import("./features/dashboard/DashboardPage"));
const ProfilePage = lazy(() => import("./features/profile/ProfilePage"));
const IdVerificationPage = lazy(() => import("./features/verification/IdVerificationPage"));
const InterviewPage = lazy(() => import("./features/interview/InterviewPage"));
const RecruiterLoginPage = lazy(() => import("./features/recruiter/RecruiterLoginPage"));
const RecruiterReportPage = lazy(() => import("./features/recruiter/RecruiterReportPage"));

const guarded = (node: React.ReactNode) => <RequireAuth>{node}</RequireAuth>;

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/dashboard" element={guarded(<DashboardPage />)} />
        <Route path="/onboarding/profile" element={guarded(<ProfilePage />)} />
        <Route path="/onboarding/id-verification" element={guarded(<IdVerificationPage />)} />
        <Route path="/interviews/:interviewId" element={guarded(<InterviewPage />)} />
        {/* Recruiters sign in with a per-report login; separate from candidate accounts. */}
        <Route path="/recruiter/login" element={<RecruiterLoginPage />} />
        <Route path="/recruiter/report" element={<RecruiterReportPage />} />
        <Route path="/recruiter" element={<Navigate to="/recruiter/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
