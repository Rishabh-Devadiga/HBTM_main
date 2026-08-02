import { useEffect, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { AppLayout } from "@/layouts/AppLayout";
import { AIMentorPage } from "@/pages/AIMentorPage";
import { ApiTestPage } from "@/pages/ApiTestPage";
import { ChatPage } from "@/pages/ChatPage";
import { AuthChoicePage } from "@/pages/AuthChoicePage";
import { CommunityPage } from "@/pages/CommunityPage";
import { CuratorOnboardingPage } from "@/pages/CuratorOnboardingPage";
import { CuratorOnboardingSuccessPage } from "@/pages/CuratorOnboardingSuccessPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { HomePage } from "@/pages/HomePage";
import { LearningPlanPage } from "@/pages/LearningPlanPage";
import { LoginPage } from "@/pages/LoginPage";
import { MerchandisePage } from "@/pages/MerchandisePage";
import { MockInterviewPage } from "@/pages/MockInterviewPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { OpportunitiesPage } from "@/pages/OpportunitiesPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { ProgressPage } from "@/pages/ProgressPage";
import { QuizPage } from "@/pages/QuizPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { useAuth } from "@/context/AuthContext";
import { useSession } from "@/context/SessionContext";
import { activeDomain, onboardingRoute } from "@/domain";
import { getCuratorGrowthJourney } from "@/api/curatorApi";
import { journeyToWorkflow } from "@/utils/curatorWorkflow";

export default function App() {
  return (
    <Routes>
      <Route index element={<HomePage />} />
      <Route
        path="auth"
        element={
          <PublicOnly>
            <AuthChoicePage />
          </PublicOnly>
        }
      />
      <Route
        path="login"
        element={
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        }
      />
      <Route
        path="register"
        element={
          <PublicOnly>
            <RegisterPage />
          </PublicOnly>
        }
      />
      <Route
        path="curator/onboarding"
        element={
          <RequireAuth allowIncompleteOnboarding>
            <CuratorOnboardingPage />
          </RequireAuth>
        }
      />
      <Route
        path="curator/onboarding/success"
        element={
          <RequireAuth allowIncompleteOnboarding>
            <CuratorOnboardingSuccessPage />
          </RequireAuth>
        }
      />
      <Route
        element={
          <RequireAuth>
            <HydrateCuratorWorkspace>
              <AppLayout />
            </HydrateCuratorWorkspace>
          </RequireAuth>
        }
      >
        <Route
          path="onboarding"
          element={
            activeDomain.id === "curator" ? (
              <CuratorOnboardingPage />
            ) : (
              <OnboardingPage />
            )
          }
        />
        <Route path="chat" element={<ChatPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="learning-plan" element={<LearningPlanPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="quiz" element={<QuizPage />} />
        <Route path="mentor" element={<AIMentorPage />} />
        <Route path="interview" element={<MockInterviewPage />} />
        <Route path="feedback" element={<Navigate to="/dashboard" replace />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="opportunities" element={<OpportunitiesPage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route path="merchandise" element={<MerchandisePage />} />
        <Route path="api-test" element={<ApiTestPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function PublicOnly({ children }: { children: ReactNode }) {
  const auth = useAuth();
  if (auth.isLoading) {
    return <div className="min-h-screen bg-[#e8eff9]" />;
  }
  if (auth.isAuthenticated) {
    return (
      <Navigate
        replace
        to={auth.onboardingCompleted ? "/dashboard" : onboardingRoute()}
      />
    );
  }
  return children;
}

function RequireAuth({
  allowIncompleteOnboarding = false,
  children,
}: {
  allowIncompleteOnboarding?: boolean;
  children: ReactNode;
}) {
  const auth = useAuth();
  const location = useLocation();

  if (auth.isLoading) {
    return <div className="min-h-screen bg-[#e8eff9]" />;
  }
  if (!auth.isAuthenticated) {
    return <Navigate replace state={{ from: location.pathname }} to="/" />;
  }
  if (
    activeDomain.id === "curator" &&
    !allowIncompleteOnboarding &&
    !auth.onboardingCompleted
  ) {
    return <Navigate replace to="/curator/onboarding" />;
  }
  return children;
}

function HydrateCuratorWorkspace({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const { dispatch, state } = useSession();

  useEffect(() => {
    if (
      activeDomain.id !== "curator" ||
      !auth.isAuthenticated ||
      !auth.onboardingCompleted ||
      state.learningPlan
    ) {
      return;
    }

    let isMounted = true;
    void getCuratorGrowthJourney()
      .then((response) => {
        if (!isMounted) {
          return;
        }
        dispatch({
          type: "SESSION_SUCCESS",
          payload: {
            workflow: journeyToWorkflow(response.data),
            user: auth.user
              ? {
                  id: auth.user.id,
                  name: auth.user.name,
                  email: auth.user.email,
                  created_at: auth.user.createdAt,
                }
              : null,
          },
        });
      })
      .catch(() => {
        // Individual pages render their API errors; the guard only hydrates dashboard state.
      });

    return () => {
      isMounted = false;
    };
  }, [
    auth.isAuthenticated,
    auth.onboardingCompleted,
    auth.user,
    dispatch,
    state.learningPlan,
  ]);

  return children;
}
