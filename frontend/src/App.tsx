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
import { FeedbackNudgesPage } from "@/pages/FeedbackNudgesPage";
import { HomePage } from "@/pages/HomePage";
import { LearningPlanPage } from "@/pages/LearningPlanPage";
import { LoginPage } from "@/pages/LoginPage";
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
import { activeDomain } from "@/domain";
import { getCuratorGrowthJourney } from "@/api/curatorApi";
import type { CuratorGrowthJourneyResponse } from "@/types/curator";
import type { LearningSessionResponse } from "@/types/learning";

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
        to={auth.onboardingCompleted ? "/dashboard" : "/curator/onboarding"}
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
            workflow: toWorkflow(response.data),
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

function toWorkflow(journey: CuratorGrowthJourneyResponse): LearningSessionResponse {
  return {
    learner_intent: {
      learning_goal: journey.decision.currentFocus,
      subject: journey.growthPlan.journey.growthTheme,
      current_skill_level: journey.growthPlan.journey.currentStage,
      available_time: journey.identityProfile.available_time,
      target_deadline: journey.estimatedCompletion,
      preferred_learning_style:
        journey.growthPlan.curationStrategy.recommendedLearningStyle,
      is_complete: true,
      missing_information: [],
      follow_up_questions: [],
    },
    learning_plan: {
      learning_goal: journey.decision.currentFocus,
      subject: journey.growthPlan.journey.growthTheme,
      learner_level: journey.growthPlan.journey.currentStage,
      total_available_time: journey.identityProfile.available_time,
      target_deadline: journey.estimatedCompletion,
      preferred_learning_style:
        journey.growthPlan.curationStrategy.recommendedLearningStyle,
      overview: journey.coachSummary,
      phases: journey.phases.map((phase) => ({
        phase_number: phase.phaseNumber,
        title: phase.title,
        objective: phase.summary,
        recommended_topics: phase.activities.map((activity) => activity.task),
        estimated_duration: phase.weekRange,
        milestones: journey.growthPlan.weeklyMilestones
          .filter((milestone) => milestone.week === phase.phaseNumber)
          .map((milestone) => milestone.outcome),
        suggested_resource_categories: phase.resources.map(
          (resource) => `${resource.resourceType}: ${resource.title}`
        ),
      })),
      final_milestone: journey.growthPlan.journey.destination,
    },
    progress_report: {
      current_phase: journey.currentPhase.phaseNumber,
      overall_completion_percentage: journey.progressPercentage,
      completed_topics: journey.phases.flatMap((phase) =>
        phase.activities
          .filter((activity) => activity.status === "completed")
          .map((activity) => activity.task)
      ),
      remaining_topics: journey.phases.flatMap((phase) =>
        phase.activities
          .filter((activity) => activity.status !== "completed")
          .map((activity) => activity.task)
      ),
      completed_milestones: [],
      next_recommended_task: journey.todayActivity.task,
      learner_status: "On Track",
      summary: journey.coachSummary,
    },
    feedback_report: {
      overall_performance_assessment: journey.growthPlan.mission.successDefinition,
      strengths: journey.identityProfile.strengths,
      areas_for_improvement: journey.identityProfile.growth_opportunities,
      personalized_study_recommendations: journey.growthPlan.habits.daily,
      motivation_message: journey.growthPlan.mission.purpose,
      next_study_session_focus: journey.todayActivity.task,
    },
    nudge_report: {
      intervention_required: false,
      learner_status: "On Track",
      nudge_type: "Study Suggestion",
      personalized_message: journey.coachSummary,
      recommended_action: journey.todayActivity.task,
      urgency: "Low",
    },
    workflow_completed: true,
    current_stage: "completed",
    error_message: null,
  };
}
