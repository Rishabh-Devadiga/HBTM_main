import type { ApiSuccessResponse } from "@/types/api";

export type CuratorOnboardingRequest = {
  identity: {
    name: string;
    age: number;
    profession: string;
  };
  curiosity: {
    interests: string[];
    customInterest: string;
    curiosityPrompt: string;
  };
  aspirations: {
    futureIdentity: string;
    aspiration: string;
    horizon: string;
  };
  availability: {
    weeklyHours: number;
    preferredDays: string[];
    habitAnchor: string;
  };
  content: {
    types: string[];
    depth: string;
  };
  coach: {
    personality: string;
    communicationStyle: string;
    checkInFrequency: string;
  };
};

export type CuratorOnboardingResponse = {
  accepted: boolean;
  status: string;
  message: string;
  nextRoute: string;
  submittedAt: string;
  identityProfileId: number;
  identityProfile: {
    current_identity: string;
    desired_future_identity: string;
    core_interests: string[];
    growth_themes: string[];
    strengths: string[];
    growth_opportunities: string[];
    learning_preferences: string[];
    coach_preferences: string[];
    available_time: string;
    initial_personalization_summary: string;
  };
  growthPlan: {
    journey: {
      title: string;
      currentStage: string;
      destination: string;
      estimatedDuration: string;
      growthTheme: string;
    };
    mission: {
      purpose: string;
      successDefinition: string;
    };
    dailyFocus: {
      objective: string;
      estimatedMinutes: number;
    };
    weeklyMilestones: {
      week: number;
      title: string;
      outcome: string;
    }[];
    habits: {
      daily: string[];
      weekly: string[];
    };
    curationStrategy: {
      recommendedMediaCategories: string[];
      recommendedLearningStyle: string;
      recommendedActivityTypes: string[];
    };
    reflectionPrompts: string[];
    successMetrics: {
      indicators: string[];
    };
    aiSummary: string;
  };
};

export type CuratorOnboardingApiResponse =
  ApiSuccessResponse<CuratorOnboardingResponse>;
