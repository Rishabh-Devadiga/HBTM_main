import {
  CalendarDays,
  Loader2,
  MapPin,
  Monitor,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { Button } from "@/components/common/Button";
import {
  useCuratorCommunityWorkshops,
  useJoinCuratorCommunityWorkshop,
  useLeaveCuratorCommunityWorkshop,
} from "@/hooks/useCuratorApi";
import type { CommunityWorkshop } from "@/types/curator";


export function CommunityPage() {
  const workshopsQuery = useCuratorCommunityWorkshops();
  const joinWorkshop = useJoinCuratorCommunityWorkshop();
  const leaveWorkshop = useLeaveCuratorCommunityWorkshop();
  const data = workshopsQuery.data?.data ?? null;
  const isMutating = joinWorkshop.isPending || leaveWorkshop.isPending;

  if (workshopsQuery.isLoading) {
    return (
      <div className="space-y-5">
        <div className="glass-panel h-44 animate-pulse rounded-[8px]" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="metric-card h-72 animate-pulse" />
          <div className="metric-card h-72 animate-pulse" />
          <div className="metric-card h-72 animate-pulse" />
        </div>
      </div>
    );
  }

  if (workshopsQuery.isError) {
    return (
      <section className="glass-panel rounded-[8px] p-6">
        <h2 className="text-lg font-semibold text-slate-950">
          Unable to load community workshops
        </h2>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
          {workshopsQuery.error.message}
        </p>
      </section>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-5">
      <section className="glass-panel rounded-[8px] p-5 sm:p-6">
        <div className="max-w-3xl">
          <div className="glass-control mb-4 inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-slate-600">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            AI-powered peer workshops
          </div>
          <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
            Community
          </h1>
          <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
            Join workshops recommended from your identity profile, profession,
            interests, growth journey, location signals, and similar Curator users.
          </p>
        </div>
      </section>

      {data.workshops.length === 0 ? (
        <section className="metric-card p-8 text-center">
          <h2 className="text-base font-semibold text-slate-950">
            No workshops yet
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-600">
            Complete onboarding and generate a growth journey so the Community
            Agent can recommend sessions.
          </p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {data.workshops.map((workshop) => (
            <WorkshopCard
              isBusy={isMutating}
              key={workshop.id}
              onJoin={(id) => joinWorkshop.mutate(id)}
              onLeave={(id) => leaveWorkshop.mutate(id)}
              workshop={workshop}
            />
          ))}
        </section>
      )}
    </div>
  );
}

function WorkshopCard({
  isBusy,
  onJoin,
  onLeave,
  workshop,
}: {
  isBusy: boolean;
  onJoin: (id: number) => void;
  onLeave: (id: number) => void;
  workshop: CommunityWorkshop;
}) {
  return (
    <article className="metric-card flex min-h-[320px] flex-col p-5 transition hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="blue-pill rounded-full px-3 py-1 text-xs font-semibold">
            {workshop.isOnline ? "Online" : "Nearby"}
          </span>
          <h2 className="mt-3 text-lg font-semibold leading-6 text-slate-950">
            {workshop.title}
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {workshop.topicGoal}
          </p>
        </div>
        <span className="glass-control inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-slate-600">
          <UsersRound className="h-4 w-4" aria-hidden="true" />
          {workshop.participantsCount}
        </span>
      </div>

      <div className="mt-5 grid gap-2 text-sm font-semibold text-slate-600">
        <span className="inline-flex items-center gap-2">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          {formatDateTime(workshop.dateTime)}
        </span>
        <span className="inline-flex items-center gap-2">
          {workshop.isOnline ? (
            <Monitor className="h-4 w-4" aria-hidden="true" />
          ) : (
            <MapPin className="h-4 w-4" aria-hidden="true" />
          )}
          {workshop.location}
        </span>
      </div>

      <p className="mt-5 rounded-[8px] bg-slate-50 p-3 text-sm font-medium leading-6 text-slate-600">
        {workshop.matchingReason}
      </p>

      <Button
        className="mt-auto w-full"
        disabled={isBusy}
        onClick={() =>
          workshop.isJoined ? onLeave(workshop.id) : onJoin(workshop.id)
        }
        variant={workshop.isJoined ? "secondary" : "default"}
      >
        {isBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        {workshop.isJoined ? "Leave workshop" : "Join workshop"}
      </Button>
    </article>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
