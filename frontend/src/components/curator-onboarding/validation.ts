import type {
  CuratorOnboardingData,
  CuratorStepId,
} from "@/components/curator-onboarding/types";

export function validateCuratorStep(
  step: CuratorStepId,
  data: CuratorOnboardingData
): string | null {
  if (step === 1) {
    const age = Number(data.identity.age);
    if (data.identity.name.trim().length < 2) {
      return "Enter your name.";
    }
    if (!Number.isFinite(age) || age < 13 || age > 100) {
      return "Enter an age between 13 and 100.";
    }
    if (data.identity.profession.trim().length < 2) {
      return "Enter your profession or current role.";
    }
  }

  if (step === 2) {
    if (data.curiosity.interests.length === 0 && !data.curiosity.customInterest.trim()) {
      return "Choose at least one interest or add your own.";
    }
    if (data.curiosity.curiosityPrompt.trim().length < 8) {
      return "Share one thing you are curious about right now.";
    }
  }

  if (step === 3) {
    if (data.aspirations.futureIdentity.trim().length < 8) {
      return "Describe the future identity you want to grow into.";
    }
    if (data.aspirations.aspiration.trim().length < 8) {
      return "Add one aspiration saarthi.ai can help you move toward.";
    }
    if (!data.aspirations.horizon) {
      return "Choose a time horizon.";
    }
  }

  if (step === 4) {
    if (data.availability.preferredDays.length === 0) {
      return "Choose when you are most available.";
    }
    if (data.availability.habitAnchor.trim().length < 4) {
      return "Add a habit anchor.";
    }
  }

  if (step === 5) {
    if (data.content.types.length === 0) {
      return "Choose at least one preferred content type.";
    }
    if (!data.content.depth) {
      return "Choose a preferred depth.";
    }
  }

  if (step === 6) {
    if (!data.coach.personality) {
      return "Choose a coach personality.";
    }
    if (!data.coach.communicationStyle) {
      return "Choose a communication style.";
    }
    if (!data.coach.checkInFrequency) {
      return "Choose a check-in frequency.";
    }
  }

  return null;
}
