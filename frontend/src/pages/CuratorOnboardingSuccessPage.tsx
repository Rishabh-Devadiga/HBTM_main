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
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#080b14] px-4 py-10 text-white">
      <div className="landing-grid absolute inset-0 -z-20 opacity-25" />
      <div className="landing-light-path absolute inset-0 -z-10" />
      <section className="w-full max-w-2xl rounded-lg border border-white/12 bg-white/8 p-6 text-center shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-9">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-md border border-cyan-200/30 bg-cyan-300/14 text-cyan-100">
          <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
        </span>
        <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-cyan-200">
          Setup captured
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-normal sm:text-4xl">
          Curator is preparing your workspace
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-6 text-slate-400 sm:text-base">
          Your onboarding answers are available as one local object. This temporary screen is ready for the next phase of the Curator flow.
        </p>

        <div className="mt-7 rounded-md border border-white/10 bg-black/20 p-4 text-left">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <Sparkles className="h-4 w-4 text-cyan-200" aria-hidden="true" />
            Local state summary
          </div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-slate-500">Name</dt>
              <dd className="mt-1 font-bold text-white">
                {onboardingData?.identity.name || "Not available"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Coach</dt>
              <dd className="mt-1 font-bold text-white">
                {onboardingData?.coach.personality || "Not available"}
              </dd>
            </div>
          </dl>
        </div>

        <Link
          className={cn(
            buttonVariants({ size: "large" }),
            "mt-7 bg-cyan-300 text-slate-950 hover:bg-cyan-200"
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
