import type { LucideIcon } from "lucide-react";

export type DomainNavigationItem = {
  icon: LucideIcon;
  label: string;
  path: string;
};

export type DomainConfig = {
  id: string;
  application: {
    name: string;
    assistantName: string;
    assistantShortName: string;
    defaultUserName: string;
    documentTitle: string;
    workspaceName: string;
  };
  navigation: {
    ariaLabel: string;
    items: readonly DomainNavigationItem[];
  };
  features: {
    dashboard: string;
    plan: string;
    progress: string;
    quiz: string;
    mentor: string;
    interview: string;
    feedback: string;
  };
  dashboard: {
    pageTitle: string;
    activeWorkspaceLabel: string;
    personalReportTitle: string;
    personalReportFallback: string;
    noProgressSummary: string;
    notificationSubtitle: string;
    emptyTitle: string;
    emptyDescription: string;
    topicsCompleted: string;
    quizAverage: string;
    interviews: string;
    streak: string;
    startToday: string;
    noCompletedInterviews: string;
    interviewAnalytics: string;
    noInterviewData: string;
    startInterview: string;
    interviewEmptyDescription: string;
    continueAction: string;
    activitySeriesLabel: string;
  };
  pages: {
    plan: {
      emptyTitle: string;
      emptyDescription: string;
      createAction: string;
      continueAction: string;
      finalMilestone: string;
      phasesLabel: string;
      phaseProgress: string;
      estimatingTime: string;
    };
    progress: {
      eyebrow: string;
      title: string;
      emptyTitle: string;
      emptyDescription: string;
      emptyAction: string;
      summary: string;
      journey: string;
      timeline: string;
      roadmapCoverage: string;
      topics: string;
    };
    quiz: {
      eyebrow: string;
      emptyTitle: string;
      emptyDescription: string;
      emptyAction: string;
      loadingTitle: string;
      loadingDescription: string;
      generateAction: string;
      requestFailed: string;
      noTopics: string;
      description: (goal: string, topicCount: number) => string;
    };
    mentor: {
      description: string;
      unavailableTitle: string;
      thinkingLabel: string;
      welcomeTitle: string;
      welcomeDescription: string;
      inputLabel: string;
      inputPlaceholder: string;
      starterPrompts: readonly string[];
    };
    interview: {
      emptyTitle: string;
      emptyDescription: string;
      emptyAction: string;
      setupEyebrow: string;
      setupDescription: string;
      goalLabel: string;
      interviewerSubtitle: string;
      welcomeSpeech: string;
    };
    feedback: {
      coachLabel: string;
      emptyTitle: string;
      emptyDescription: string;
    };
    chat: {
      title: string;
      description: string;
      emptyGoalError: string;
      minimumGoalError: (minimumLength: number) => string;
      inputLabel: string;
      inputPlaceholder: string;
      inputHint: string;
      generatingLabel: string;
      loadingDescription: string;
      workflowCompleted: string;
      intentTitle: string;
      goalLabel: string;
      availableTimeLabel: string;
      styleLabel: string;
    };
    onboarding: {
      profileTitle: string;
      createAction: string;
      loadingTitle: string;
      loadingDescription: string;
      loadingStages: readonly string[];
      goalDescription: string;
      quickGoalsLabel: string;
      customGoalLabel: string;
      skillDescription: string;
      studyTimeDescription: string;
      targetDateDescription: string;
      targetDateHint: string;
      preferencesDescription: string;
      preferencesLabel: string;
      goalError: string;
      preferencesError: string;
    };
  };
  calendar: {
    eventTitle: string;
    goalLabel: string;
    missingPlanError: string;
  };
  landing: Record<string, string>;
  labels: {
    subject: string;
    skillLevel: string;
    targetDeadline: string;
    targetCompletion: string;
    dailyCommitment: string;
    currentStage: string;
    workflowStatus: string;
    progressSummary: string;
    completion: string;
    currentGoal: string;
    completed: string;
    remaining: string;
    roadmapTopics: string;
    currentSkillLevel: string;
    availableTime: string;
    status: string;
    nextTask: string;
    latestFeedback: string;
    latestNudge: string;
  };
};
