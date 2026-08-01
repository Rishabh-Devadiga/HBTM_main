import { Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "@/layouts/AppLayout";
import { AIMentorPage } from "@/pages/AIMentorPage";
import { ApiTestPage } from "@/pages/ApiTestPage";
import { ChatPage } from "@/pages/ChatPage";
import { CuratorOnboardingPage } from "@/pages/CuratorOnboardingPage";
import { CuratorOnboardingSuccessPage } from "@/pages/CuratorOnboardingSuccessPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { FeedbackNudgesPage } from "@/pages/FeedbackNudgesPage";
import { HomePage } from "@/pages/HomePage";
import { LearningPlanPage } from "@/pages/LearningPlanPage";
import { MockInterviewPage } from "@/pages/MockInterviewPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { ProgressPage } from "@/pages/ProgressPage";
import { QuizPage } from "@/pages/QuizPage";
import { activeDomain } from "@/domain";

export default function App() {
  return (
    <Routes>
      <Route path="curator/onboarding" element={<CuratorOnboardingPage />} />
      <Route
        path="curator/onboarding/success"
        element={<CuratorOnboardingSuccessPage />}
      />
      <Route element={<AppLayout />}>
        <Route
          index
          element={
            activeDomain.id === "curator" ? (
              <Navigate to="/curator/onboarding" replace />
            ) : (
              <HomePage />
            )
          }
        />
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
        <Route path="feedback" element={<FeedbackNudgesPage />} />
        <Route path="api-test" element={<ApiTestPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
