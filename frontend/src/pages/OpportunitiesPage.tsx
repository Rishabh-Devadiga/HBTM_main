import {
  Bookmark,
  CalendarDays,
  ExternalLink,
  Loader2,
  MapPin,
  RefreshCcw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/common/Button";
import {
  useBookmarkCuratorOpportunity,
  useCuratorOpportunities,
  useDismissCuratorOpportunity,
  useRefreshCuratorOpportunities,
} from "@/hooks/useCuratorApi";
import type {
  OpportunityCategory,
  OpportunityMode,
  OpportunityRecommendation,
} from "@/types/curator";
import { cn } from "@/utils/cn";

const categories: Array<"All" | OpportunityCategory> = [
  "All",
  "Hackathon",
  "Internship",
  "Job",
  "Workshop",
  "Meetup",
  "Conference",
  "Community",
  "Open Source",
  "Competition",
  "Certification",
];

const modes: Array<"All" | OpportunityMode> = [
  "All",
  "Online",
  "Offline",
  "Hybrid",
  "Unknown",
];

export function OpportunitiesPage() {
  const opportunitiesQuery = useCuratorOpportunities();
  const refreshOpportunities = useRefreshCuratorOpportunities();
  const bookmarkOpportunity = useBookmarkCuratorOpportunity();
  const dismissOpportunity = useDismissCuratorOpportunity();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [mode, setMode] = useState<(typeof modes)[number]>("All");
  const [location, setLocation] = useState("");
  const data = opportunitiesQuery.data?.data ?? null;
  const filteredOpportunities = useMemo(
    () =>
      filterOpportunities(data?.opportunities ?? [], {
        category,
        location,
        mode,
        search,
      }),
    [category, data?.opportunities, location, mode, search]
  );

  if (opportunitiesQuery.isLoading) {
    return (
      <div className="space-y-5">
        <div className="glass-panel h-44 animate-pulse rounded-[8px]" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="metric-card h-80 animate-pulse" />
          <div className="metric-card h-80 animate-pulse" />
          <div className="metric-card h-80 animate-pulse" />
        </div>
      </div>
    );
  }

  if (opportunitiesQuery.isError) {
    return (
      <section className="glass-panel rounded-[8px] p-6">
        <h2 className="text-lg font-semibold text-slate-950">
          Unable to load opportunities
        </h2>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
          {opportunitiesQuery.error.message}
        </p>
      </section>
    );
  }

  if (!data) {
    return null;
  }

  function handleBookmark(opportunity: OpportunityRecommendation) {
    bookmarkOpportunity.mutate({
      opportunity,
      value: !opportunity.isBookmarked,
    });
  }

  function handleDismiss(opportunity: OpportunityRecommendation) {
    dismissOpportunity.mutate({ opportunity, value: true });
  }

  return (
    <div className="space-y-5">
      <section className="glass-panel rounded-[8px] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="glass-control mb-4 inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-slate-600">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Real opportunities, ranked by saarthi.ai
            </div>
            <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
              Opportunities
            </h1>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
              {data.recommendationSummary}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {data.selectionReasons.map((reason) => (
                <span
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600"
                  key={reason}
                >
                  {reason}
                </span>
              ))}
            </div>
          </div>
          <Button
            disabled={refreshOpportunities.isPending}
            onClick={() => refreshOpportunities.mutate()}
            variant="secondary"
          >
            {refreshOpportunities.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            )}
            Refresh
          </Button>
        </div>
      </section>

      <section className="metric-card p-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_auto] xl:items-center">
          <label className="glass-control flex min-h-12 items-center gap-2 rounded-full px-4">
            <Search className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
            <input
              aria-label="Search opportunities"
              className="workspace-search-input min-w-0 flex-1 text-sm font-semibold outline-none"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, organizer, reason, or tags"
              type="text"
              value={search}
            />
            {search ? (
              <button
                aria-label="Clear opportunity search"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                onClick={() => setSearch("")}
                type="button"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </label>
          <input
            aria-label="Filter by location"
            className="h-12 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none"
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Location"
            type="text"
            value={location}
          />
          <div className="flex gap-2 overflow-x-auto pb-1 xl:justify-end">
            {modes.map((item) => (
              <FilterButton
                active={mode === item}
                key={item}
                label={item}
                onClick={() => setMode(item)}
              />
            ))}
          </div>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {categories.map((item) => (
            <FilterButton
              active={category === item}
              key={item}
              label={item}
              onClick={() => setCategory(item)}
            />
          ))}
        </div>
      </section>

      {filteredOpportunities.length === 0 ? (
        <section className="metric-card p-8 text-center">
          <h2 className="text-base font-semibold text-slate-950">
            No opportunities found
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-600">
            Try a broader filter or refresh to fetch new source-backed results.
          </p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filteredOpportunities.map((opportunity) => (
            <OpportunityCard
              isBusy={bookmarkOpportunity.isPending || dismissOpportunity.isPending}
              key={opportunity.id}
              onBookmark={handleBookmark}
              onDismiss={handleDismiss}
              opportunity={opportunity}
            />
          ))}
        </section>
      )}
    </div>
  );
}

function FilterButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "inline-flex min-h-10 shrink-0 items-center justify-center rounded-full px-4 text-sm font-semibold transition",
        active ? "blue-pill" : "glass-control text-slate-600 hover:text-slate-950"
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function OpportunityCard({
  isBusy,
  onBookmark,
  onDismiss,
  opportunity,
}: {
  isBusy: boolean;
  onBookmark: (opportunity: OpportunityRecommendation) => void;
  onDismiss: (opportunity: OpportunityRecommendation) => void;
  opportunity: OpportunityRecommendation;
}) {
  return (
    <article className="metric-card flex min-h-[360px] flex-col p-5 transition hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span className="blue-pill rounded-full px-3 py-1 text-xs font-semibold">
              {opportunity.category}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {opportunity.relevanceScore}% match
            </span>
          </div>
          <h2 className="mt-3 text-lg font-semibold leading-6 text-slate-950">
            {opportunity.title}
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {opportunity.organizer}
          </p>
        </div>
        <button
          aria-label={
            opportunity.isBookmarked
              ? "Remove opportunity bookmark"
              : "Bookmark opportunity"
          }
          className={cn(
            "glass-control inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            opportunity.isBookmarked ? "text-slate-950" : "text-slate-500"
          )}
          disabled={isBusy}
          onClick={() => onBookmark(opportunity)}
          type="button"
        >
          <Bookmark
            className={cn("h-5 w-5", opportunity.isBookmarked && "fill-current")}
            aria-hidden="true"
          />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          {opportunity.date}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-4 w-4" aria-hidden="true" />
          {opportunity.location}
        </span>
      </div>

      <p className="mt-4 text-sm font-medium leading-6 text-slate-600">
        {opportunity.description}
      </p>
      <p className="mt-4 rounded-[8px] bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-600">
        {opportunity.aiExplanation}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {opportunity.tags.map((tag) => (
          <span
            className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-500"
            key={`${opportunity.id}-${tag}`}
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-5 sm:flex-row">
        <Button
          className="flex-1"
          onClick={() =>
            window.open(opportunity.url, "_blank", "noopener,noreferrer")
          }
        >
          Apply/Register
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          disabled={isBusy}
          onClick={() => onDismiss(opportunity)}
          variant="secondary"
        >
          Dismiss
        </Button>
      </div>
    </article>
  );
}

function filterOpportunities(
  opportunities: OpportunityRecommendation[],
  filters: {
    category: "All" | OpportunityCategory;
    location: string;
    mode: "All" | OpportunityMode;
    search: string;
  }
) {
  const search = filters.search.trim().toLowerCase();
  const location = filters.location.trim().toLowerCase();
  return opportunities.filter((opportunity) => {
    const searchable = [
      opportunity.title,
      opportunity.organizer,
      opportunity.description,
      opportunity.aiExplanation,
      opportunity.location,
      opportunity.category,
      ...opportunity.tags,
    ]
      .join(" ")
      .toLowerCase();
    return (
      (filters.category === "All" || opportunity.category === filters.category) &&
      (filters.mode === "All" || opportunity.mode === filters.mode) &&
      (!location || opportunity.location.toLowerCase().includes(location)) &&
      (!search || searchable.includes(search))
    );
  });
}
