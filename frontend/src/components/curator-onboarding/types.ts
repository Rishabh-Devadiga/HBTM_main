export type CuratorStepId = 1 | 2 | 3 | 4 | 5 | 6;

export type CuratorOnboardingData = {
  identity: {
    name: string;
    age: string;
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

export type CuratorStepProps = {
  data: CuratorOnboardingData;
  error: string | null;
  updateData: (nextData: CuratorOnboardingData) => void;
};
