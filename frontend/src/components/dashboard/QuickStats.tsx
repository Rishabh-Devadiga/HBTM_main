import {
  BookOpenCheck,
  BriefcaseBusiness,
  ClipboardCheck,
  Flame,
  type LucideIcon,
} from "lucide-react";

import { activeDomain } from "@/domain";

type QuickStatsProps = {
  completedTopics: number;
  progressPercentage: number;
  totalTopics: number;
};

export function QuickStats({
  completedTopics,
  progressPercentage,
  totalTopics,
}: QuickStatsProps) {
  const completion =
    totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);
  const growthScore = Math.min(
    100,
    Math.max(progressPercentage, completion, completedTopics * 10)
  );
  const stats: Array<{
    detail: string;
    icon: LucideIcon;
    label: string;
    value: string;
  }> = [
    {
      detail: `${completion}% completed`,
      icon: BookOpenCheck,
      label: activeDomain.dashboard.topicsCompleted,
      value: `${completedTopics} / ${totalTopics}`,
    },
    {
      detail:
        completedTopics === 0
          ? "Complete actions to raise it"
          : "Rises as you finish actions",
      icon: ClipboardCheck,
      label: activeDomain.dashboard.quizAverage,
      value: `${growthScore}`,
    },
    {
      detail: activeDomain.dashboard.noCompletedInterviews,
      icon: BriefcaseBusiness,
      label: activeDomain.dashboard.interviews,
      value: "0",
    },
    {
      detail: activeDomain.dashboard.startToday,
      icon: Flame,
      label: activeDomain.dashboard.streak,
      value: "-",
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(({ detail, icon: Icon, label, value }) => (
        <article
          className="metric-card group min-h-36 rounded-[18px] p-5 transition hover:-translate-y-1 active:translate-y-0"
          key={label}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-[15px] bg-slate-950 text-white transition"
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <p
              className="text-sm font-bold text-slate-500 transition"
            >
              {label}
            </p>
          </div>
          <p
            className="mt-4 text-3xl font-black text-slate-950 transition"
          >
            {value}
          </p>
          <p
            className="mt-2 text-xs font-semibold text-slate-500 transition"
          >
            {detail}
          </p>
        </article>
      ))}
    </section>
  );
}
