import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  Flame,
  LayoutDashboard,
  Sparkles,
  Waves,
} from "lucide-react";
import { Link } from "react-router-dom";

import { buttonVariants } from "@/components/common/buttonVariants";
import { SaarthiLogo } from "@/components/common/SaarthiLogo";
import { activeDomain } from "@/domain";
import { cn } from "@/utils/cn";

export function HomePage() {
  return (
    <main className="workspace-shell min-h-screen overflow-hidden bg-[#bdbdbd] text-slate-950">
      <header className="border-b border-slate-200/80 bg-white/45">
        <nav className="app-container flex h-16 items-center justify-between gap-4">
          <Link className="flex items-center gap-3" to="/">
            <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-slate-950 text-white">
              <SaarthiLogo className="h-5 w-6" />
            </span>
            <span className="text-base font-semibold text-slate-950">
              {activeDomain.application.name}
            </span>
          </Link>
          <div className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
            <a href="#features">Features</a>
            <a href="#method">Method</a>
            <a href="#product">Product</a>
          </div>
          <div className="flex items-center gap-3">
            <Link className="hidden text-sm font-semibold text-slate-700 sm:inline" to="/login">
              Sign in
            </Link>
            <Link
              className={cn(buttonVariants(), "bg-slate-950 px-5 text-white")}
              to="/auth"
            >
              Start Your Journey
            </Link>
          </div>
        </nav>
      </header>

      <section className="app-container grid min-h-[calc(100vh-4rem)] items-start gap-12 py-12 lg:grid-cols-[1.08fr_0.92fr] lg:py-20">
        <div className="pt-4 lg:pt-8">
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-normal text-slate-950 sm:text-7xl">
            Become the person you imagine.
          </h1>
          <p className="mt-8 max-w-2xl text-lg font-medium leading-8 text-slate-600">
            {activeDomain.application.name} is a personal growth workspace that
            turns your goals into a saved journey, focused resources, real
            opportunities, habits, and coaching.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              className={cn(buttonVariants({ size: "large" }), "bg-slate-950 px-8 text-white")}
              to="/auth"
            >
              Start Your Journey
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              className={cn(buttonVariants({ size: "large", variant: "secondary" }), "px-8")}
              to="/login"
            >
              See the dashboard
            </Link>
          </div>
          <div className="mt-12 grid max-w-2xl grid-cols-3 gap-6 text-left">
            <Stat value="14 min" label="average daily practice" />
            <Stat value="92%" label="keep their streak past week 6" />
            <Stat value="6 formats" label="curated into one journey" />
          </div>
        </div>

        <div className="grid gap-4 lg:pt-0" id="product">
          <section className="glass-panel rounded-[8px] p-6">
            <div className="flex items-center justify-between gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Today's focus
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950">
                  Complete one focused growth action
                </p>
              </div>
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-[10px] border-slate-950 bg-white text-center">
                <div>
                  <p className="text-2xl font-semibold text-slate-950">82</p>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Score
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="glass-panel rounded-[8px] p-6" id="method">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              <Waves className="h-4 w-4" aria-hidden="true" />
              AI daily insight
            </p>
            <p className="mt-4 text-sm font-medium leading-6 text-slate-700">
              You make the most progress when your next step is small, visible,
              and attached to a repeatable habit. saarthi.ai keeps that action
              ready before the day gets noisy.
            </p>
          </section>

          <div className="grid gap-4 sm:grid-cols-2" id="features">
            <PreviewCard icon={Flame} value="34" label="day habit streak" />
            <PreviewCard icon={BookOpen} value="12" label="resources curated this week" />
          </div>
        </div>
      </section>

      <section className="app-container pb-20">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-600">
          The system
        </p>
        <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
          Eight quiet mechanisms working on your behalf.
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <PreviewCard icon={LayoutDashboard} value="Plan" label="journey, habits, and progress in one workspace" />
          <PreviewCard icon={Sparkles} value="Coach" label="daily prompts shaped around your growth goal" />
          <PreviewCard icon={CalendarCheck} value="Focus" label="protected actions that fit your real schedule" />
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-medium leading-5 text-slate-600">{label}</p>
    </div>
  );
}

function PreviewCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
}) {
  return (
    <section className="glass-panel rounded-[8px] p-6">
      <Icon className="h-4 w-4 text-slate-600" aria-hidden="true" />
      <p className="mt-5 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-medium leading-5 text-slate-600">{label}</p>
    </section>
  );
}
