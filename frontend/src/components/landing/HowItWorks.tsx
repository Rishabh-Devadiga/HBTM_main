import {
  Flag,
  Map,
  MessageCircleMore,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { activeDomain } from "@/domain";

const steps = [
  {
    title: activeDomain.landing.howStep1Title,
    description: activeDomain.landing.howStep1Description,
    icon: Flag,
  },
  {
    title: activeDomain.landing.howStep2Title,
    description: activeDomain.landing.howStep2Description,
    icon: Map,
  },
  {
    title: activeDomain.landing.howStep3Title,
    description: activeDomain.landing.howStep3Description,
    icon: TrendingUp,
  },
  {
    title: activeDomain.landing.howStep4Title,
    description: activeDomain.landing.howStep4Description,
    icon: MessageCircleMore,
  },
];

export function HowItWorks() {
  return (
    <section
      className="scroll-mt-20 bg-white py-20 sm:py-24"
      id="how-it-works"
    >
      <div className="mx-auto w-[min(100%-2rem,1180px)]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase text-violet-700">
            {activeDomain.landing.howEyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
            {activeDomain.landing.howHeading}
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            {activeDomain.landing.howDescription}
          </p>
        </div>

        <div className="relative mt-12 grid gap-8 md:grid-cols-4 md:gap-4">
          <div className="absolute left-[12.5%] right-[12.5%] top-7 hidden h-px bg-slate-200 md:block" />
          {steps.map((step, index) => (
            <Step
              description={step.description}
              icon={step.icon}
              index={index + 1}
              key={step.title}
              title={step.title}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Step({
  description,
  icon: Icon,
  index,
  title,
}: {
  description: string;
  icon: LucideIcon;
  index: number;
  title: string;
}) {
  return (
    <article className="relative text-center">
      <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-md border border-slate-200 bg-white text-blue-700 shadow-sm">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className="mt-5 text-xs font-bold uppercase text-slate-400">
        Step {index}
      </p>
      <h3 className="mt-2 text-base font-semibold text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-600">
        {description}
      </p>
    </article>
  );
}
