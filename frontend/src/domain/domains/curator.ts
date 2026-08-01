import {
  LayoutDashboard,
  LibraryBig,
  Map,
  MessagesSquare,
  NotebookPen,
  Repeat,
  Settings,
  UserRound,
} from "lucide-react";

import type { DomainConfig } from "@/domain/types";

export const curatorDomain: DomainConfig = {
  id: "curator",
  application: {
    name: "saarthi.ai",
    assistantName: "saarthi.ai",
    assistantShortName: "saarthi",
    defaultUserName: "saarthi.ai Member",
    documentTitle: "saarthi.ai",
    workspaceName: "Growth Workspace",
  },
  navigation: {
    ariaLabel: "saarthi.ai workspace navigation",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { label: "Growth Journey", path: "/learning-plan", icon: Map },
      { label: "Growth Coach", path: "/mentor", icon: MessagesSquare },
      { label: "Curated Resources", path: "/quiz", icon: LibraryBig },
      { label: "Habits", path: "/progress", icon: Repeat },
      { label: "Reflections", path: "/feedback", icon: NotebookPen },
      { label: "Profile", path: "/profile", icon: UserRound },
      { label: "Settings", path: "/settings", icon: Settings },
    ],
  },
  features: {
    dashboard: "Dashboard",
    plan: "Growth Journey",
    progress: "Habits",
    quiz: "Curated Resources",
    mentor: "Growth Coach",
    interview: "Profile",
    feedback: "Reflections",
  },
  dashboard: {
    pageTitle: "Growth Dashboard",
    activeWorkspaceLabel: "Active growth workspace",
    personalReportTitle: "Your personal growth overview",
    personalReportFallback:
      "Create a journey from chat, then track habits, reflections, resources, and next steps here.",
    noProgressSummary: "No growth summary available yet.",
    notificationSubtitle: "Growth prompts",
    emptyTitle: "No active growth journey yet",
    emptyDescription:
      "Start a saarthi.ai session from chat, then return here to see your journey, habits, reflections, and recommendations in one place.",
    topicsCompleted: "Actions Completed",
    quizAverage: "Resource Fit",
    interviews: "Profile Reviews",
    streak: "Habit Streak",
    startToday: "Start today",
    noCompletedInterviews: "No profile reviews",
    interviewAnalytics: "Profile Insights",
    noInterviewData: "No profile insights yet",
    startInterview: "Review Profile",
    interviewEmptyDescription:
      "Complete your first profile review to unlock focus, consistency, and confidence insights.",
    continueAction: "Continue Journey",
    activitySeriesLabel: "Growth",
  },
  pages: {
    plan: {
      emptyTitle: "No growth journey yet",
      emptyDescription:
        "Start a saarthi.ai session in chat to generate a personalized journey. Once the workflow returns a path, it will appear here automatically.",
      createAction: "Create Growth Journey",
      continueAction: "Continue to Habits",
      finalMilestone: "Final Milestone",
      phasesLabel: "Journey Phases",
      phaseProgress: "Phase Progress",
      estimatingTime: "Estimating time...",
    },
    progress: {
      eyebrow: "Habits",
      title: "Habit tracking overview",
      emptyTitle: "No habits tracked yet",
      emptyDescription:
        "Start a saarthi.ai session in chat. Once the workflow produces a progress summary, your consistency metrics and next action will appear here.",
      emptyAction: "Start saarthi.ai Session",
      summary: "Habit Summary",
      journey: "Growth Journey",
      timeline: "Habit Timeline",
      roadmapCoverage: "Journey Coverage",
      topics: "Actions",
    },
    quiz: {
      eyebrow: "Curated Resources",
      emptyTitle: "Create a growth journey first",
      emptyDescription:
        "saarthi.ai uses your current journey to organize focused resources. Complete onboarding to generate a journey.",
      emptyAction: "Create Growth Journey",
      loadingTitle: "Preparing resources",
      loadingDescription:
        "saarthi.ai is turning your journey into a focused resource set.",
      generateAction: "Refresh Resources",
      requestFailed: "Resource request failed",
      noTopics: "The current journey does not contain any resource topics.",
      description: (goal, topicCount) =>
        `Review resources for ${goal} across ${topicCount} journey ${
          topicCount === 1 ? "area" : "areas"
        }.`,
    },
    mentor: {
      description: "Ask questions about your growth journey.",
      unavailableTitle: "Unable to contact Growth Coach.",
      thinkingLabel: "saarthi.ai is thinking...",
      welcomeTitle: "Meet saarthi.ai",
      welcomeDescription:
        "Ask about your journey, habits, resources, reflections, or next step.",
      inputLabel: "Message Growth Coach",
      inputPlaceholder: "Ask anything about your journey or next step...",
      starterPrompts: [
        "Help me choose a next step",
        "How should I build a daily habit?",
        "Suggest a reflection prompt",
        "Find resources for this goal",
      ],
    },
    interview: {
      emptyTitle: "No growth journey yet",
      emptyDescription:
        "Create a growth journey first so saarthi.ai can prepare a profile review around your goal.",
      emptyAction: "Create Growth Journey",
      setupEyebrow: "Profile Workspace",
      setupDescription:
        "Configure a focused review based on your current growth goal.",
      goalLabel: "Growth Goal",
      interviewerSubtitle: "saarthi.ai profile coach",
      welcomeSpeech: "Welcome to your profile review. Let's begin.",
    },
    feedback: {
      coachLabel: "Growth Coach",
      emptyTitle: "No reflections yet",
      emptyDescription:
        "Start a saarthi.ai session first, and your reflections and prompts will appear here.",
    },
    chat: {
      title: "Build your personalized growth journey",
      description:
        "Tell saarthi.ai what you want to improve, your timeline, and your current context. It will shape a structured journey with next steps, reflections, and prompts.",
      emptyGoalError: "Enter a growth goal before creating a journey.",
      minimumGoalError: (minimumLength) =>
        `Your growth goal must be at least ${minimumLength} characters.`,
      inputLabel: "Describe your growth goal",
      inputPlaceholder:
        'Example: "I want to build a consistent morning routine over the next 8 weeks."',
      inputHint:
        "Include your goal, current context, timeline, and available time.",
      generatingLabel: "Creating your growth journey...",
      loadingDescription:
        "saarthi.ai is reading your goal and shaping a practical path.",
      workflowCompleted: "saarthi.ai workflow completed",
      intentTitle: "Growth Intent",
      goalLabel: "Growth Goal",
      availableTimeLabel: "Available Time",
      styleLabel: "Preferred Approach",
    },
    onboarding: {
      profileTitle: "Build your growth profile",
      createAction: "Create Growth Journey",
      loadingTitle: "saarthi.ai is building your path",
      loadingDescription:
        "Your answers are being transformed into a personalized growth workflow.",
      loadingStages: [
        "Understanding your growth goal...",
        "Building your personalized journey...",
        "Mapping habits...",
        "Preparing reflection prompts...",
        "Almost ready...",
      ],
      goalDescription:
        "Choose a popular path or describe the outcome you want saarthi.ai to help you reach.",
      quickGoalsLabel: "Quick growth goals",
      customGoalLabel: "Custom growth goal",
      skillDescription:
        "Your starting point helps saarthi.ai choose the right depth, pacing, and sequence.",
      studyTimeDescription:
        "Choose a sustainable daily commitment. saarthi.ai will shape the journey around the time you can consistently protect.",
      targetDateDescription:
        "Set the date you want to reach your goal. You can adjust your pace later as your journey evolves.",
      targetDateHint:
        "saarthi.ai will use this deadline and your daily commitment to personalize the number, pacing, and duration of journey phases.",
      preferencesDescription:
        "Select every format that helps you stay engaged. saarthi.ai will include these preferences in your profile.",
      preferencesLabel: "Growth preferences",
      goalError: "Choose a growth goal or enter a custom goal.",
      preferencesError: "Select at least one growth preference.",
    },
  },
  calendar: {
    eventTitle: "saarthi.ai Focus Session",
    goalLabel: "Growth Goal",
    missingPlanError: "Create a growth journey before scheduling sessions.",
  },
  landing: {
    companionBadge: "Your AI Growth Companion",
    heroTitle: "Grow intentionally with",
    heroDescription:
      "An AI-powered companion that organizes personal growth journeys, recommends focused resources, supports habits, and prompts useful reflection.",
    previewAriaLabel: "saarthi.ai growth dashboard preview",
    previewHost: "growth.curator.ai",
    previewRoadmap: "Growth Journey",
    previewMilestone: "Your next step is ready",
    previewRoadmapMetric: "Journey",
    previewDailyFocus: "Daily focus",
    previewProgress: "Momentum",
    previewPhase: "Foundation phase",
    previewCoach: "Growth coach",
    previewCoachBody:
      "You are building steady momentum. Complete one focused action today and capture a short reflection.",
    featureEyebrow: "One workspace, steady support",
    featureHeading: "Everything you need to keep growth moving",
    featureDescription:
      "saarthi.ai connects journey planning, habit support, reflection, and resources into one clear experience.",
    howEyebrow: "How it works",
    howHeading: "From intention to a clear next step",
    howDescription:
      "A simple workflow turns an open-ended goal into a system you can actually follow.",
    benefitEyebrow: "Why saarthi.ai?",
    benefitHeading: "Support built around your momentum",
    benefitDescription:
      "More than a one-time plan, saarthi.ai gives you a connected loop of direction, reflection, and focused action.",
    faqDescription:
      "saarthi.ai keeps the path into your growth workflow simple and intentional.",
    ctaHeading: "Start Your Growth Journey Today",
    ctaDescription:
      "Turn your goal into a practical journey, then keep moving with habits, resources, and reflective next steps.",
    ctaAction: "Create My Growth Journey",
    footerCopyright: "Copyright 2026 saarthi.ai. All rights reserved.",
    featurePlannerTitle: "Growth Journey",
    featurePlannerDescription:
      "Creates a personalized, milestone-based journey based on your goal, starting point, schedule, and target date.",
    featureProgressTitle: "Habits",
    featureProgressDescription:
      "Track consistency, milestones, upcoming actions, and overall momentum in one place.",
    featureMentorTitle: "Growth Coach",
    featureMentorDescription:
      "Chat with a coach for guidance, reflection prompts, resource direction, and personalized support.",
    featureQuizTitle: "Curated Resources",
    featureQuizDescription:
      "Organize focused resources that match your current journey and next step.",
    featureInterviewTitle: "Profile",
    featureInterviewDescription:
      "Review your goals, context, preferences, and progress signals as your journey evolves.",
    featureFeedbackTitle: "Reflections",
    featureFeedbackDescription:
      "Capture useful reflections and receive prompts that help you stay intentional.",
    featureResourcesTitle: "Resource Curation",
    featureResourcesDescription:
      "Access curated resources for every journey area, organized around practical progress.",
    featureCalendarTitle: "Scheduled Focus",
    featureCalendarDescription:
      "Sync focus sessions with your calendar to protect time and stay accountable.",
    howStep1Title: "Tell saarthi.ai your goal",
    howStep1Description:
      "Share what you want to improve, your current context, available time, and target date.",
    howStep2Title: "Receive a personalized journey",
    howStep2Description:
      "Get a phased path with actions, milestones, and realistic pacing.",
    howStep3Title: "Track habits and milestones",
    howStep3Description:
      "See completed actions, remaining areas, overall momentum, and your next step.",
    howStep4Title: "Reflect and adjust",
    howStep4Description:
      "Use coaching prompts and curated resources to stay focused and accountable.",
    benefit1Title: "Personalized Direction",
    benefit1Description:
      "Your journey reflects your starting point, schedule, deadline, and target outcome.",
    benefit2Title: "Steady Accountability",
    benefit2Description:
      "Prompts and reminders keep the next action visible when momentum starts to drift.",
    benefit3Title: "Continuous Growth",
    benefit3Description:
      "Every stage connects to the next, so your journey stays practical and measurable.",
    faq1Question: "What information does saarthi.ai need?",
    faq1Answer:
      "A clear growth goal, your current context, available time, and target date are enough to create a complete journey.",
    faq2Question: "Does the landing page create a session?",
    faq2Answer:
      "No. It only introduces saarthi.ai and takes you to Chat. A session starts only after you submit your request there.",
    faq3Question: "Can I return to my journey after refreshing?",
    faq3Answer:
      "Yes. Your current session is stored in the browser so the dashboard, journey, habits, and reflections remain available.",
  },
  labels: {
    subject: "Focus Area",
    skillLevel: "Starting Point",
    targetDeadline: "Target Date",
    targetCompletion: "Target Completion",
    dailyCommitment: "Daily Commitment",
    currentStage: "Current Stage",
    workflowStatus: "Workflow Status",
    progressSummary: "Growth Summary",
    completion: "Completion",
    currentGoal: "Current Goal",
    completed: "Completed",
    remaining: "Remaining",
    roadmapTopics: "Journey Areas",
    currentSkillLevel: "Current Starting Point",
    availableTime: "Available Time",
    status: "Status",
    nextTask: "Next Action",
    latestFeedback: "Latest Reflection",
    latestNudge: "Latest Prompt",
  },
};
