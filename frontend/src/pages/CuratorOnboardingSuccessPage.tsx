import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { buttonVariants } from "@/components/common/buttonVariants";
import type { CuratorOnboardingData } from "@/components/curator-onboarding/types";
import { activeDomain } from "@/domain";
import { cn } from "@/utils/cn";

type SuccessLocationState = {
  onboardingData?: CuratorOnboardingData;
};

export function CuratorOnboardingSuccessPage() {
  const location = useLocation();
  const onboardingData = (location.state as SuccessLocationState | null)
    ?.onboardingData;

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#bdbdbd] px-4 py-10 text-slate-950">
      <section className="w-full max-w-2xl rounded-[8px] border border-[#e2e2e2] bg-white p-6 text-center shadow-[0_24px_70px_rgba(36,36,36,0.14)] sm:p-9">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[8px] bg-slate-950 text-white shadow-[0_14px_28px_rgba(24,24,24,0.14)]">
          <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
        </span>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Setup captured
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
          saarthi.ai is preparing your workspace
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-6 text-slate-500 sm:text-base">
          Your onboarding answers are available as one local object. This temporary screen is ready for the next phase of the saarthi.ai flow.
        </p>

        <div className="mt-7 rounded-[8px] border border-[#e2e2e2] bg-[#f2f2f2] p-4 text-left">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <Sparkles className="h-4 w-4 text-slate-500" aria-hidden="true" />
            Local state summary
          </div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-slate-500">Name</dt>
              <dd className="mt-1 font-bold text-slate-950">
                {onboardingData?.identity.name || "Not available"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Coach</dt>
              <dd className="mt-1 font-bold text-slate-950">
                {onboardingData?.coach.personality || "Not available"}
              </dd>
            </div>
          </dl>
        </div>

        <Link
          className={cn(
            buttonVariants({ size: "large" }),
            "mt-7 bg-slate-950 text-white hover:bg-slate-800"
          )}
          to="/dashboard"
        >
          Continue to {activeDomain.features.dashboard}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
