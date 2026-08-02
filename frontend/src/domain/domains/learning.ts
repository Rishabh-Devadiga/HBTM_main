import {
  BookOpen,
  BriefcaseBusiness,
  ClipboardCheck,
  LayoutDashboard,
  MessagesSquare,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";

import type { DomainConfig } from "@/domain/types";

export const learningDomain: DomainConfig = {
  id: "learning",
  application: {
    name: "Saarthi.AI",
    assistantName: "Saarthi AI",
    assistantShortName: "Saarthi",
    defaultUserName: "Saarthi Learner",
    documentTitle: "AI Learning Agent",
    workspaceName: "Learning Workspace",
  },
  navigation: {
    ariaLabel: "Workspace navigation",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { label: "Learning Plan", path: "/learning-plan", icon: BookOpen },
      { label: "Quiz", path: "/quiz", icon: ClipboardCheck },
      { label: "AI Mentor", path: "/mentor", icon: MessagesSquare },
      {
        label: "Mock Interview",
        path: "/interview",
        icon: BriefcaseBusiness,
      },
      { label: "Progress", path: "/progress", icon: TrendingUp },
      { label: "Merchandise", path: "/merchandise", icon: ShoppingBag },
    ],
  },
  features: {
    dashboard: "Dashboard",
    plan: "Learning Plan",
    progress: "Progress",
    quiz: "Quiz",
    mentor: "AI Mentor",
    interview: "Mock Interview",
    feedback: "Feedback",
  },
  dashboard: {
    pageTitle: "Learning Report",
    activeWorkspaceLabel: "Active learning workspace",
    personalReportTitle: "Your personal learning report",
    personalReportFallback:
      "Build a roadmap from chat, then track study goals, feedback, nudges, and schedules here.",
    noProgressSummary: "No progress summary available yet.",
    notificationSubtitle: "Learning nudges",
    emptyTitle: "No active learning session yet",
    emptyDescription:
      "Generate a learning plan from the chat page, then come back here to see your goal, progress, feedback, and nudges in one place.",
    topicsCompleted: "Topics Completed",
    quizAverage: "Quiz Average",
    interviews: "Mock Interviews",
    streak: "Study Streak",
    startToday: "Start learning today",
    noCompletedInterviews: "No completed interviews",
    interviewAnalytics: "Interview Analytics",
    noInterviewData: "No interviews completed yet",
    startInterview: "Start Mock Interview",
    interviewEmptyDescription:
      "Complete your first mock interview to unlock technical, communication, and confidence insights.",
    continueAction: "Continue Learning",
    activitySeriesLabel: "Learning",
  },
  pages: {
    plan: {
      emptyTitle: "No learning plan yet",
      emptyDescription:
        "Start a learning session in chat to generate a personalized roadmap. Once the Planner Agent returns a plan, it will appear here automatically.",
      createAction: "Generate Learning Plan",
      continueAction: "Continue to Progress",
      finalMilestone: "Final Milestone",
      phasesLabel: "Learning Phases",
      phaseProgress: "Phase Progress",
      estimatingTime: "Estimating learning time...",
    },
    progress: {
      eyebrow: "Learning Progress",
      title: "Study tracking overview",
      emptyTitle: "No progress recorded yet",
      emptyDescription:
        "Start a learning session in chat. Once the workflow produces a progress report, your completion metrics and next action will appear here.",
      emptyAction: "Start Learning Session",
      summary: "Progress Summary",
      journey: "Learning Journey",
      timeline: "Progress Timeline",
      roadmapCoverage: "Roadmap Coverage",
      topics: "Topics",
    },
    quiz: {
      eyebrow: "Knowledge Check",
      emptyTitle: "Generate a learning plan first",
      emptyDescription:
        "Saarthi uses the topics in your current roadmap to create a focused quiz. Complete onboarding to generate a learning plan.",
      emptyAction: "Create Learning Plan",
      loadingTitle: "Preparing your quiz",
      loadingDescription:
        "Saarthi is turning your roadmap topics into five focused questions.",
      generateAction: "Generate Quiz",
      requestFailed: "Quiz request failed",
      noTopics:
        "The current learning plan does not contain any quiz topics.",
      description: (goal, topicCount) =>
        `Test your understanding of ${goal} across ${topicCount} roadmap ${
          topicCount === 1 ? "topic" : "topics"
        }.`,
    },
    mentor: {
      description: "Ask questions about your learning journey.",
      unavailableTitle: "Unable to contact AI Mentor.",
      thinkingLabel: "Saarthi AI is thinking...",
      welcomeTitle: "Meet Saarthi AI",
      welcomeDescription:
        "Ask questions about your roadmap, concepts, coding problems, or anything you're learning.",
      inputLabel: "Message AI Mentor",
      inputPlaceholder: "Ask anything about your roadmap or learning...",
      starterPrompts: [
        "Explain Python Dictionaries",
        "How should I study Machine Learning?",
        "Test my understanding of NumPy",
        "Give me a SQL practice question",
      ],
    },
    interview: {
      emptyTitle: "No learning plan yet",
      emptyDescription:
        "Generate a learning plan first so Saarthi can prepare an interview around your goal.",
      emptyAction: "Create Learning Plan",
      setupEyebrow: "Practice Workspace",
      setupDescription:
        "Configure a focused text interview based on your current learning goal.",
      goalLabel: "Learning Goal",
      interviewerSubtitle: "Saarthi interview coach",
      welcomeSpeech: "Welcome to your mock interview. Let's begin.",
    },
    feedback: {
      coachLabel: "AI Study Coach",
      emptyTitle: "No feedback yet",
      emptyDescription:
        "Generate a learning session first, and your AI feedback and study nudges will appear here.",
    },
    chat: {
      title: "Build your personalized learning plan",
      description:
        "Tell the AI Learning Agent what you want to learn, your timeline, and your current level. It will generate a structured roadmap with next steps, feedback, and nudges.",
      emptyGoalError: "Enter a learning goal before generating a plan.",
      minimumGoalError: (minimumLength) =>
        `Your learning goal must be at least ${minimumLength} characters.`,
      inputLabel: "Describe your learning goal",
      inputPlaceholder:
        'Example: "I want to become a Data Scientist in 6 months with 2 hours of study every day."',
      inputHint:
        "Include your target role, current level, timeline, and study time.",
      generatingLabel: "Generating your learning plan...",
      loadingDescription:
        "The AI Learning Agent is reading your goal and building a roadmap.",
      workflowCompleted: "Learning workflow completed",
      intentTitle: "Learner Intent",
      goalLabel: "Learning Goal",
      availableTimeLabel: "Available Time",
      styleLabel: "Learning Style",
    },
    onboarding: {
      profileTitle: "Build your learning profile",
      createAction: "Generate Learning Plan",
      loadingTitle: "Saarthi is building your path",
      loadingDescription:
        "Your five answers are being transformed into a personalized learning workflow.",
      loadingStages: [
        "Understanding your learning goal...",
        "Building your personalized roadmap...",
        "Tracking milestones...",
        "Preparing AI feedback...",
        "Almost ready...",
      ],
      goalDescription:
        "Choose a popular path or describe the outcome you want Saarthi.AI to help you reach.",
      quickGoalsLabel: "Quick learning goals",
      customGoalLabel: "Custom learning goal",
      skillDescription:
        "Your starting point helps Saarthi choose the right depth, pacing, and sequence.",
      studyTimeDescription:
        "Choose a sustainable daily commitment. Saarthi will shape the roadmap around the time you can consistently protect.",
      targetDateDescription:
        "Set the date you want to reach your goal. You can adjust your pace later as your learning journey evolves.",
      targetDateHint:
        "Saarthi will use this deadline and your daily study time to personalize the number, pacing, and duration of roadmap phases.",
      preferencesDescription:
        "Select every format that helps you stay engaged. Saarthi will include these preferences in your learning profile.",
      preferencesLabel: "Learning preferences",
      goalError: "Choose a learning goal or enter a custom goal.",
      preferencesError: "Select at least one learning preference.",
    },
  },
  calendar: {
    eventTitle: "📚 Saarthi.AI Study Session",
    goalLabel: "Learning Goal",
    missingPlanError: "Generate a learning plan before scheduling sessions.",
  },
  landing: {
    companionBadge: "Your AI Learning Companion",
    heroTitle: "Learn smarter with",
    heroDescription:
      "An AI-powered learning companion that creates personalized roadmaps, tracks your progress, provides intelligent feedback, and keeps you accountable until you achieve your goals.",
    previewAriaLabel: "Saarthi.AI learning dashboard preview",
    previewHost: "learning.saarthi.ai",
    previewRoadmap: "Data Science Roadmap",
    previewMilestone: "Your next milestone is ready",
    previewRoadmapMetric: "Roadmap",
    previewDailyFocus: "Daily focus",
    previewProgress: "Progress",
    previewPhase: "Foundations phase",
    previewCoach: "AI coach",
    previewCoachBody:
      "You are building steady momentum. Complete one focused Python exercise today before moving to statistics.",
    featureEyebrow: "One companion, complete support",
    featureHeading: "Everything you need to keep learning forward",
    featureDescription:
      "Saarthi.AI connects planning, progress, coaching, and accountability into one clear learning experience.",
    howEyebrow: "How it works",
    howHeading: "From ambition to a clear next step",
    howDescription:
      "A simple workflow turns an open-ended goal into a learning system you can actually follow.",
    benefitEyebrow: "Why Saarthi.AI?",
    benefitHeading: "Learning support built around your momentum",
    benefitDescription:
      "More than a one-time plan, Saarthi.AI gives you a connected loop of direction, reflection, and focused action.",
    faqDescription:
      "Saarthi.AI keeps the path into your learning workflow simple and intentional.",
    ctaHeading: "Start Your Learning Journey Today",
    ctaDescription:
      "Turn your goal into a practical roadmap, then keep moving with clear progress, adaptive feedback, and accountable next steps.",
    ctaAction: "Generate My Learning Plan",
    footerCopyright: "Copyright 2026 Saarthi.AI. All rights reserved.",
    featurePlannerTitle: "AI Learning Planner",
    featurePlannerDescription:
      "Creates a personalized, milestone-based learning roadmap based on your goal, current skill level, schedule, and target deadline.",
    featureProgressTitle: "Progress Tracking",
    featureProgressDescription:
      "Monitor completion, milestones, estimated completion date, upcoming tasks, and overall learning progress in real time.",
    featureMentorTitle: "AI Mentor",
    featureMentorDescription:
      "Chat with an AI mentor for concept explanations, doubt solving, study guidance, and personalized learning support.",
    featureQuizTitle: "Quiz & Knowledge Checks",
    featureQuizDescription:
      "Generate AI-powered quizzes to assess your understanding and identify concepts that need revision.",
    featureInterviewTitle: "Mock Interview",
    featureInterviewDescription:
      "Practice AI-powered mock interviews with voice interaction, instant evaluation, and detailed performance feedback.",
    featureFeedbackTitle: "Smart Feedback & Nudges",
    featureFeedbackDescription:
      "Receive personalized feedback, actionable recommendations, and intelligent nudges to stay on track.",
    featureResourcesTitle: "YouTube Learning Resources",
    featureResourcesDescription:
      "Access curated YouTube learning resources for every topic, complete with estimated learning time based on real video durations.",
    featureCalendarTitle: "Google Calendar Integration",
    featureCalendarDescription:
      "Sync your learning roadmap with Google Calendar to schedule study sessions and stay accountable.",
    howStep1Title: "Tell Saarthi your goal",
    howStep1Description:
      "Share what you want to learn, your current level, available time, and deadline.",
    howStep2Title: "Receive a personalized roadmap",
    howStep2Description:
      "Get a phased learning plan with topics, milestones, and realistic pacing.",
    howStep3Title: "Track progress and milestones",
    howStep3Description:
      "See completed work, remaining topics, overall progress, and your next action.",
    howStep4Title: "Receive AI coaching",
    howStep4Description:
      "Use adaptive feedback and smart nudges to stay focused and accountable.",
    benefit1Title: "Personalized Learning",
    benefit1Description:
      "Your roadmap reflects your starting point, schedule, deadline, and target outcome.",
    benefit2Title: "AI Accountability",
    benefit2Description:
      "Feedback and nudges keep the next action visible when motivation starts to drift.",
    benefit3Title: "Continuous Progress",
    benefit3Description:
      "Every stage connects to the next, so your learning plan stays practical and measurable.",
    faq1Question: "What information does Saarthi.AI need?",
    faq1Answer:
      "A clear learning goal, your current skill level, available study time, and target deadline are enough to generate a complete roadmap.",
    faq2Question: "Does the landing page create a learning session?",
    faq2Answer:
      "No. It only introduces Saarthi.AI and takes you to Chat. A session starts only after you submit your learning request there.",
    faq3Question: "Can I return to my plan after refreshing?",
    faq3Answer:
      "Yes. Your current session is stored in the browser so the dashboard, learning plan, progress, and feedback views remain available.",
  },
  labels: {
    subject: "Subject",
    skillLevel: "Skill Level",
    targetDeadline: "Target Deadline",
    targetCompletion: "Target Completion",
    dailyCommitment: "Daily Study Time",
    currentStage: "Current Stage",
    workflowStatus: "Workflow Status",
    progressSummary: "Progress Summary",
    completion: "Completion",
    currentGoal: "Current Goal",
    completed: "Completed",
    remaining: "Remaining",
    roadmapTopics: "Roadmap Topics",
    currentSkillLevel: "Current Skill Level",
    availableTime: "Available Time",
    status: "Status",
    nextTask: "Next Task",
    latestFeedback: "Latest Feedback",
    latestNudge: "Latest Nudge",
  },
};
