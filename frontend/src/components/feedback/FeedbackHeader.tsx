import { BookOpen, LayoutDashboard, MessageCircle, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

import { activeDomain } from "@/domain";

type FeedbackHeaderProps = {
  currentStage: string | null;
  goal: string | null;
  subject: string | null;
  workflowCompleted: boolean;
};

export function FeedbackHeader({
  currentStage,
  goal,
  subject,
  workflowCompleted,
}: FeedbackHeaderProps) {
  return (
    <section className="glass-panel rounded-[28px] p-6 sm:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="blue-pill mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full text-white">
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-sm font-bold text-slate-500">
            {activeDomain.pages.feedback.coachLabel}
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-normal text-slate-950 sm:text-3xl">
            {activeDomain.features.feedback}
          </h1>
          {goal ? (
            <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-600">
              {goal}
            </p>
          ) : null}
        </div>
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
          <Link
            className="blue-pill inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-black text-white"
            to="/dashboard"
          >
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            {activeDomain.features.dashboard}
          </Link>
          <Link
            className="glass-control inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-black text-slate-700"
            to="/learning-plan"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            {activeDomain.features.plan}
          </Link>
          <Link
            className="glass-control inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-black text-slate-700"
            to="/progress"
          >
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
            {activeDomain.features.progress}
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatusMeta label={activeDomain.labels.subject} value={subject} />
        <StatusMeta
          label={activeDomain.labels.currentStage}
          value={currentStage}
        />
        <StatusMeta
          label={activeDomain.labels.workflowStatus}
          value={workflowCompleted ? "Completed" : "In progress"}
        />
      </div>
    </section>
  );
}

type StatusMetaProps = {
  label: string;
  value: string | null;
};

function StatusMeta({ label, value }: StatusMetaProps) {
  if (!value) {
    return null;
  }

  return (
    <div className="glass-control rounded-[18px] p-3">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}
