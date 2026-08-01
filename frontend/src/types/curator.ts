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
  decision: {
    currentFocus: string;
    recommendedAction: "learn" | "practice" | "reflect" | "build_habit" | "review";
    recommendedResourceType: "youtube" | "article" | "book" | "podcast" | "course";
    difficulty: "beginner" | "intermediate" | "advanced";
    estimatedDurationMinutes: number;
    priority: "low" | "medium" | "high";
    reasoning: string;
  };
};

export type CuratorOnboardingApiResponse =
  ApiSuccessResponse<CuratorOnboardingResponse>;

export type CuratorJourneyActivity = {
  id: string;
  task: string;
  durationMinutes: number;
  status: "locked" | "available" | "completed";
};

export type CuratorJourneyPhase = {
  phaseNumber: number;
  title: string;
  weekRange: string;
  summary: string;
  status: "completed" | "current" | "upcoming";
  activities: CuratorJourneyActivity[];
  resources: {
    title: string;
    resourceType: string;
    purpose: string;
  }[];
  priorities: string[];
};

export type CuratorGrowthJourneyResponse = {
  identityProfileId: number;
  identityProfile: CuratorOnboardingResponse["identityProfile"];
  growthPlan: CuratorOnboardingResponse["growthPlan"];
  decision: CuratorOnboardingResponse["decision"];
  phases: CuratorJourneyPhase[];
  currentPhase: CuratorJourneyPhase;
  todayActivity: CuratorJourneyActivity;
  dailyActivities: CuratorJourneyActivity[];
  currentPriorities: string[];
  estimatedCompletion: string;
  coachSummary: string;
  progressPercentage: number;
};

export type CuratorGrowthJourneyApiResponse =
  ApiSuccessResponse<CuratorGrowthJourneyResponse>;

export type CuratorCoachMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type CuratorCoachConversationSummary = {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type CuratorCoachConversation =
  CuratorCoachConversationSummary & {
    messages: CuratorCoachMessage[];
  };

export type CuratorCoachConversationsResponse = {
  identityProfileId: number;
  conversations: CuratorCoachConversationSummary[];
  activeConversation: CuratorCoachConversation | null;
  suggestedPrompts: string[];
};

export type CuratorCoachChatResponse = {
  conversation: CuratorCoachConversation;
  reply: string;
  suggestedPrompts: string[];
};

export type CuratorCoachConversationsApiResponse =
  ApiSuccessResponse<CuratorCoachConversationsResponse>;

export type CuratorCoachConversationApiResponse =
  ApiSuccessResponse<CuratorCoachConversation>;

export type CuratorCoachChatApiResponse =
  ApiSuccessResponse<CuratorCoachChatResponse>;

export type CuratorResourceType =
  | "Book"
  | "Video"
  | "Podcast"
  | "Article"
  | "Community";

export type CuratedResource = {
  id: string;
  title: string;
  creator: string;
  description: string;
  tags: string[];
  estimatedDuration: string;
  type: CuratorResourceType;
  url: string;
  reason: string;
  isBookmarked: boolean;
  viewedCount: number;
};

export type CuratorResourcePreferences = {
  preferredTypes: CuratorResourceType[];
  preferredTags: string[];
};

export type CuratorResourcesResponse = {
  identityProfileId: number;
  recommendationId: number;
  generatedAt: string;
  recommendationSummary: string;
  selectionReasons: string[];
  resources: CuratedResource[];
  preferences: CuratorResourcePreferences;
};

export type CuratorResourceEngagementResponse = {
  resourceId: string;
  isBookmarked: boolean;
  viewedCount: number;
};

export type CuratorResourcesApiResponse =
  ApiSuccessResponse<CuratorResourcesResponse>;

export type CuratorResourceEngagementApiResponse =
  ApiSuccessResponse<CuratorResourceEngagementResponse>;

export type CuratorResourcePreferencesApiResponse =
  ApiSuccessResponse<CuratorResourcePreferences>;

export type OpportunityCategory =
  | "Hackathon"
  | "Internship"
  | "Job"
  | "Workshop"
  | "Meetup"
  | "Conference"
  | "Community"
  | "Open Source"
  | "Competition"
  | "Certification";

export type OpportunityMode = "Online" | "Offline" | "Hybrid" | "Unknown";

export type OpportunityRecommendation = {
  id: string;
  title: string;
  category: OpportunityCategory;
  organizer: string;
  location: string;
  mode: OpportunityMode;
  date: string;
  description: string;
  relevanceScore: number;
  aiExplanation: string;
  url: string;
  tags: string[];
  source: string;
  isBookmarked: boolean;
  isDismissed: boolean;
};

export type OpportunitiesResponse = {
  identityProfileId: number;
  recommendationId: number;
  generatedAt: string;
  staleAfter: string;
  recommendationSummary: string;
  selectionReasons: string[];
  opportunities: OpportunityRecommendation[];
  filters: {
    category: OpportunityCategory | "All";
    search: string;
    location: string;
    mode: OpportunityMode | "All";
  };
};

export type OpportunityEngagementResponse = {
  opportunityId: string;
  isBookmarked: boolean;
  isDismissed: boolean;
};

export type OpportunitiesApiResponse = ApiSuccessResponse<OpportunitiesResponse>;

export type OpportunityEngagementApiResponse =
  ApiSuccessResponse<OpportunityEngagementResponse>;
