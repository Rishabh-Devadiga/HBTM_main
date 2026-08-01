import {
  BellRing,
  Bot,
  BrainCircuit,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardCheck,
  Mic,
  Youtube,
} from "lucide-react";

import { FeatureCard } from "@/components/landing/FeatureCard";
import { activeDomain } from "@/domain";

const features = [
  {
    title: activeDomain.landing.featurePlannerTitle,
    description: activeDomain.landing.featurePlannerDescription,
    icon: BrainCircuit,
    tone: "blue" as const,
  },
  {
    title: activeDomain.landing.featureProgressTitle,
    description: activeDomain.landing.featureProgressDescription,
    icon: ChartNoAxesCombined,
    tone: "emerald" as const,
  },
  {
    title: activeDomain.landing.featureMentorTitle,
    description: activeDomain.landing.featureMentorDescription,
    icon: Bot,
    tone: "violet" as const,
  },
  {
    title: activeDomain.landing.featureQuizTitle,
    description: activeDomain.landing.featureQuizDescription,
    icon: ClipboardCheck,
    tone: "amber" as const,
  },
  {
    title: activeDomain.landing.featureInterviewTitle,
    description: activeDomain.landing.featureInterviewDescription,
    icon: Mic,
    tone: "rose" as const,
  },
  {
    title: activeDomain.landing.featureFeedbackTitle,
    description: activeDomain.landing.featureFeedbackDescription,
    icon: BellRing,
    tone: "cyan" as const,
  },
  {
    title: activeDomain.landing.featureResourcesTitle,
    description: activeDomain.landing.featureResourcesDescription,
    icon: Youtube,
    tone: "rose" as const,
  },
  {
    title: activeDomain.landing.featureCalendarTitle,
    description: activeDomain.landing.featureCalendarDescription,
    icon: CalendarDays,
    tone: "blue" as const,
  },
];

export function FeatureGrid() {
  return (
    <section
      className="scroll-mt-20 border-b border-slate-200 bg-slate-50 py-20 sm:py-24"
      id="features"
    >
      <div className="mx-auto w-[min(100%-2rem,1180px)]">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase text-blue-700">
            {activeDomain.landing.featureEyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
            {activeDomain.landing.featureHeading}
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            {activeDomain.landing.featureDescription}
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
