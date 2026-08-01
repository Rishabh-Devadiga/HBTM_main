import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/common/Button";
import {
  curatorSteps,
} from "@/components/curator-onboarding/options";
import {
  AspirationsStep,
  AvailabilityStep,
  BasicIdentityStep,
  CoachStyleStep,
  ContentTypesStep,
  InterestsStep,
} from "@/components/curator-onboarding/CuratorOnboardingSteps";
import type {
  CuratorOnboardingData,
  CuratorStepId,
} from "@/components/curator-onboarding/types";
import { validateCuratorStep } from "@/components/curator-onboarding/validation";
import { activeDomain } from "@/domain";
import { useSubmitCuratorOnboarding } from "@/hooks/useCuratorApi";
import type { CuratorOnboardingRequest } from "@/types/curator";
import { cn } from "@/utils/cn";

const initialCuratorData: CuratorOnboardingData = {
  identity: {
    name: activeDomain.application.defaultUserName,
    age: "",
    profession: "",
  },
  curiosity: {
    interests: [],
    customInterest: "",
    curiosityPrompt: "",
  },
  aspirations: {
    futureIdentity: "",
    aspiration: "",
    horizon: "",
  },
  availability: {
    weeklyHours: 5,
    preferredDays: [],
    habitAnchor: "",
  },
  content: {
    types: [],
    depth: "",
  },
  coach: {
    personality: "",
    communicationStyle: "",
    checkInFrequency: "",
  },
};

export function CuratorOnboardingWizard() {
  const [currentStep, setCurrentStep] = useState<CuratorStepId>(1);
  const [data, setData] = useState<CuratorOnboardingData>(initialCuratorData);
  const [error, setError] = useState<string | null>(null);
  const submitOnboarding = useSubmitCuratorOnboarding();
  const navigate = useNavigate();
  const currentStepConfig = curatorSteps[currentStep - 1];
  const progress = (currentStep / curatorSteps.length) * 100;

  const stepContent = useMemo(() => {
    const props = {
      data,
      error,
      updateData: (nextData: CuratorOnboardingData) => {
        setData(nextData);
        setError(null);
      },
    };

    if (currentStep === 1) {
      return <BasicIdentityStep {...props} />;
    }
    if (currentStep === 2) {
      return <InterestsStep {...props} />;
    }
    if (currentStep === 3) {
      return <AspirationsStep {...props} />;
    }
    if (currentStep === 4) {
      return <AvailabilityStep {...props} />;
    }
    if (currentStep === 5) {
      return <ContentTypesStep {...props} />;
    }
    return <CoachStyleStep {...props} />;
  }, [currentStep, data, error]);

  function handleBack() {
    setError(null);
    setCurrentStep((step) => Math.max(1, step - 1) as CuratorStepId);
  }

  function handleNext() {
    const stepError = validateCuratorStep(currentStep, data);
    if (stepError) {
      setError(stepError);
      return;
    }

    setError(null);
    setCurrentStep((step) => Math.min(curatorSteps.length, step + 1) as CuratorStepId);
  }

  function handleFinish() {
    const stepError = validateCuratorStep(6, data);
    if (stepError) {
      setError(stepError);
      return;
    }

    console.log("Curator onboarding data", data);
    setError(null);
    submitOnboarding.mutate(toOnboardingRequest(data), {
      onSuccess: (response) => {
        navigate(response.data.nextRoute, { state: { onboardingData: data } });
      },
      onError: (requestError) => {
        setError(requestError.message);
      },
    });
  }

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#bdbdbd] text-slate-950">
      <header className="border-b border-[#d7d7d7] bg-white">
        <div className="mx-auto flex h-18 w-[min(100%-2rem,1160px)] items-center justify-between">
          <Link
            aria-label={`Return to ${activeDomain.application.name} home`}
            className="inline-flex items-center gap-2.5 font-semibold"
            to="/"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-slate-950 text-white shadow-[0_10px_24px_rgba(24,24,24,0.14)]">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-semibold text-slate-950">{activeDomain.application.name}</span>
          </Link>
          <Link
            className="inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            to="/"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Back to home</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-4.5rem)] w-[min(100%-2rem,1160px)] gap-6 py-6 lg:grid-cols-[320px_1fr] lg:py-10">
        <aside className="rounded-[8px] border border-[#e2e2e2] bg-white p-4 shadow-[0_18px_46px_rgba(36,36,36,0.12)] lg:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Onboarding
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-normal text-slate-950">
            Shape your Curator experience
          </h1>
          <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
            A short setup to tune your journey, resources, habits, and coaching style.
          </p>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-slate-950 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-500">
            Step {currentStep} of {curatorSteps.length}
          </p>

          <ol className="mt-6 space-y-2">
            {curatorSteps.map((step) => {
              const isCompleted = step.id < currentStep;
              const isActive = step.id === currentStep;

              return (
                <li key={step.id}>
                  <button
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-left transition",
                      isActive
                        ? "bg-[#eeeeee] text-slate-950"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                    )}
                    onClick={() => {
                      if (step.id <= currentStep) {
                        setError(null);
                        setCurrentStep(step.id);
                      }
                    }}
                    type="button"
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-black",
                        isCompleted
                          ? "border-slate-950 bg-slate-950 text-white"
                          : isActive
                            ? "border-slate-950 text-slate-950"
                            : "border-slate-300 text-slate-500"
                      )}
                    >
                      {isCompleted ? <Check className="h-3.5 w-3.5" /> : step.id}
                    </span>
                    <span className="min-w-0 text-sm font-bold">{step.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        <section className="flex min-h-[640px] flex-col overflow-hidden rounded-[8px] border border-[#e2e2e2] bg-white shadow-[0_22px_60px_rgba(36,36,36,0.12)]">
          <div className="border-b border-[#e2e2e2] px-5 py-5 sm:px-7">
            <p className="text-sm font-semibold text-slate-500">
              {currentStepConfig.title}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
              {currentStepConfig.description}
            </h2>
          </div>

          <div className="onboarding-step flex-1 px-5 py-6 sm:px-7 sm:py-8" key={currentStep}>
            {stepContent}
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-[#e2e2e2] bg-[#f2f2f2] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <Button
              className={cn(currentStep === 1 && "invisible")}
              disabled={currentStep === 1}
              onClick={handleBack}
              variant="secondary"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </Button>
            <Button
              className="w-full bg-slate-950 text-white shadow-[0_18px_34px_rgba(24,24,24,0.18)] hover:bg-slate-800 sm:w-auto"
              disabled={submitOnboarding.isPending}
              onClick={currentStep === 6 ? handleFinish : handleNext}
              size="large"
            >
              {currentStep === 6
                ? submitOnboarding.isPending
                  ? "Finishing..."
                  : "Finish"
                : "Next"}
              {currentStep === 6 ? (
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </footer>
        </section>
      </main>
    </div>
  );
}

function toOnboardingRequest(
  data: CuratorOnboardingData
): CuratorOnboardingRequest {
  return {
    ...data,
    identity: {
      ...data.identity,
      age: Number(data.identity.age),
    },
  };
}
