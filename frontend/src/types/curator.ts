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
};

export type CuratorOnboardingApiResponse =
  ApiSuccessResponse<CuratorOnboardingResponse>;
