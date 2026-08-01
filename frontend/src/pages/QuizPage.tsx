import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  Filter,
  Loader2,
  Podcast,
  RefreshCcw,
  Send,
  Settings2,
  Sparkles,
  UsersRound,
  Video,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/common/Button";
import { EmptyQuiz } from "@/components/quiz/EmptyQuiz";
import { QuizLoading } from "@/components/quiz/QuizLoading";
import { QuizQuestionCard } from "@/components/quiz/QuizQuestionCard";
import { QuizResults } from "@/components/quiz/QuizResults";
import { useSession } from "@/context/SessionContext";
import { activeDomain } from "@/domain";
import {
  useBookmarkCuratorResource,
  useCuratorResources,
  useOpenCuratorResource,
  useRefreshCuratorResources,
  useUpdateCuratorResourcePreferences,
} from "@/hooks/useCuratorApi";
import { useGenerateQuiz, useSubmitQuiz } from "@/hooks/useQuizApi";
import type {
  CuratedResource,
  CuratorResourcePreferences,
  CuratorResourceType,
} from "@/types/curator";
import type { GeneratedQuiz, QuizSubmissionResult } from "@/types/quiz";
import { cn } from "@/utils/cn";

const DEFAULT_DIFFICULTY = "Intermediate";
const DEFAULT_QUESTION_COUNT = 5;

export function QuizPage() {
  if (activeDomain.id === "curator") {
    return <CuratorResourcesPage />;
  }

  return <LearningQuizPage />;
}

function LearningQuizPage() {
  const { state } = useSession();
  const plan = state.learningPlan;
  const generateMutation = useGenerateQuiz();
  const submitMutation = useSubmitQuiz();
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [result, setResult] = useState<QuizSubmissionResult | null>(null);
  const topics = useMemo(
    () =>
      Array.from(
        new Set(
          plan?.phases.flatMap((phase) => phase.recommended_topics) ?? []
        )
      ),
    [plan]
  );

  if (!plan) {
    return <EmptyQuiz />;
  }

  async function handleGenerateQuiz() {
    generateMutation.reset();
    submitMutation.reset();
    setQuiz(null);
    setResult(null);
    setSelectedAnswers([]);
    setCurrentQuestion(0);

    try {
      const response = await generateMutation.mutateAsync({
        topics,
        difficulty: DEFAULT_DIFFICULTY,
        number_of_questions: DEFAULT_QUESTION_COUNT,
      });
      setQuiz(response.data);
      setSelectedAnswers(
        Array.from({ length: response.data.questions.length }, () => "")
      );
    } catch {
      // Mutation state renders the API error.
    }
  }

  function handleSelectAnswer(answer: string) {
    setSelectedAnswers((currentAnswers) =>
      currentAnswers.map((currentAnswer, index) =>
        index === currentQuestion ? answer : currentAnswer
      )
    );
  }

  async function handleSubmitQuiz() {
    if (!quiz || selectedAnswers.some((answer) => !answer)) {
      return;
    }

    submitMutation.reset();
    try {
      const response = await submitMutation.mutateAsync({
        generated_quiz: quiz,
        selected_answers: selectedAnswers,
      });
      setResult(response.data);
    } catch {
      // Mutation state renders the API error.
    }
  }

  if (generateMutation.isPending) {
    return <QuizLoading />;
  }

  if (result) {
    return (
      <QuizResults
        isGenerating={generateMutation.isPending}
        onGenerateNew={() => void handleGenerateQuiz()}
        result={result}
      />
    );
  }

  if (!quiz) {
    return (
      <div className="space-y-6">
        <QuizHeader goal={plan.learning_goal} topicCount={topics.length} />
        {generateMutation.error ? (
          <QuizError message={generateMutation.error.message} />
        ) : null}
        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-3">
            <QuizSetting label="Difficulty" value={DEFAULT_DIFFICULTY} />
            <QuizSetting
              label="Questions"
              value={`${DEFAULT_QUESTION_COUNT}`}
            />
            <QuizSetting
              label={activeDomain.labels.roadmapTopics}
              value={`${topics.length}`}
            />
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              disabled={topics.length === 0}
              onClick={() => void handleGenerateQuiz()}
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {activeDomain.pages.quiz.generateAction}
            </Button>
          </div>
          {topics.length === 0 ? (
            <p className="mt-3 text-right text-sm text-amber-700">
              {activeDomain.pages.quiz.noTopics}
            </p>
          ) : null}
        </section>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const allQuestionsAnswered = selectedAnswers.every(Boolean);
  const isFinalQuestion = currentQuestion === quiz.questions.length - 1;

  return (
    <div className="space-y-5">
      <QuizHeader goal={plan.learning_goal} topicCount={quiz.topics.length} />
      {submitMutation.error ? (
        <QuizError message={submitMutation.error.message} />
      ) : null}
      <QuizQuestionCard
        currentQuestion={currentQuestion}
        onSelect={handleSelectAnswer}
        options={question.options}
        question={question.question}
        selectedAnswer={selectedAnswers[currentQuestion] ?? ""}
        totalQuestions={quiz.questions.length}
      />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          disabled={currentQuestion === 0 || submitMutation.isPending}
          onClick={() =>
            setCurrentQuestion((currentValue) => currentValue - 1)
          }
          variant="outline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Previous
        </Button>

        {isFinalQuestion ? (
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <Button
              disabled={!allQuestionsAnswered || submitMutation.isPending}
              onClick={() => void handleSubmitQuiz()}
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              {submitMutation.isPending ? "Submitting..." : "Submit Quiz"}
            </Button>
            {!allQuestionsAnswered ? (
              <p className="text-xs text-slate-500">
                Answer every question before submitting.
              </p>
            ) : null}
          </div>
        ) : (
          <Button
            disabled={submitMutation.isPending}
            onClick={() =>
              setCurrentQuestion((currentValue) => currentValue + 1)
            }
          >
            Next
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}

const RESOURCE_CATEGORIES: Array<"All" | CuratorResourceType> = [
  "All",
  "Book",
  "Video",
  "Podcast",
  "Article",
  "Community",
];

const RESOURCE_ICON_MAP = {
  Article: ClipboardCheck,
  Book: BookOpen,
  Community: UsersRound,
  Podcast,
  Video,
} satisfies Record<CuratorResourceType, typeof ClipboardCheck>;

function CuratorResourcesPage() {
  const resourcesQuery = useCuratorResources();
  const refreshResources = useRefreshCuratorResources();
  const bookmarkResource = useBookmarkCuratorResource();
  const openResource = useOpenCuratorResource();
  const updatePreferences = useUpdateCuratorResourcePreferences();
  const [search, setSearch] = useState("");
  const [category, setCategory] =
    useState<(typeof RESOURCE_CATEGORIES)[number]>("All");
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const resourcesData = resourcesQuery.data?.data ?? null;
  const filteredResources = useMemo(
    () => filterResources(resourcesData?.resources ?? [], search, category),
    [category, resourcesData?.resources, search]
  );

  if (resourcesQuery.isLoading) {
    return (
      <div className="space-y-5">
        <div className="glass-panel h-48 animate-pulse rounded-[8px]" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="metric-card h-72 animate-pulse" />
          <div className="metric-card h-72 animate-pulse" />
          <div className="metric-card h-72 animate-pulse" />
        </div>
      </div>
    );
  }

  if (resourcesQuery.isError) {
    return (
      <section className="glass-panel rounded-[8px] p-6">
        <p className="text-base font-black text-slate-950">
          Unable to load curated resources
        </p>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          {resourcesQuery.error.message}
        </p>
      </section>
    );
  }

  if (!resourcesData) {
    return <EmptyQuiz />;
  }

  function handleBookmark(resource: CuratedResource) {
    bookmarkResource.mutate({
      resource,
      bookmarked: !resource.isBookmarked,
    });
  }

  function handleOpen(resource: CuratedResource) {
    openResource.mutate(resource);
    window.open(resource.url, "_blank", "noopener,noreferrer");
  }

  async function handleSavePreferences(preferences: CuratorResourcePreferences) {
    await updatePreferences.mutateAsync(preferences);
    setIsPreferencesOpen(false);
    await refreshResources.mutateAsync();
  }

  return (
    <div className="space-y-5">
      <section className="glass-panel rounded-[8px] p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="glass-control mb-4 inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black text-slate-600">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Personalized by saarthi.ai
            </div>
            <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
              Curated Resources
            </h1>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
              {resourcesData.recommendationSummary}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {resourcesData.selectionReasons.map((reason) => (
                <span
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600"
                  key={reason}
                >
                  {reason}
                </span>
              ))}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              disabled={refreshResources.isPending}
              onClick={() => refreshResources.mutate()}
              variant="secondary"
            >
              {refreshResources.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              )}
              Refresh
            </Button>
            <Button onClick={() => setIsPreferencesOpen(true)} variant="secondary">
              <Settings2 className="h-4 w-4" aria-hidden="true" />
              Preferences
            </Button>
          </div>
        </div>
      </section>

      <section className="metric-card p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <label className="glass-control flex min-h-12 items-center gap-2 rounded-full px-4">
            <Filter className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
            <input
              aria-label="Search resources"
              className="workspace-search-input min-w-0 flex-1 text-sm font-semibold outline-none"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, creator, tag, or description"
              type="text"
              value={search}
            />
            {search ? (
              <button
                aria-label="Clear resource search"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                onClick={() => setSearch("")}
                type="button"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:justify-end">
            {RESOURCE_CATEGORIES.map((item) => (
              <button
                className={cn(
                  "inline-flex min-h-10 shrink-0 items-center justify-center rounded-full px-4 text-sm font-black transition",
                  category === item
                    ? "blue-pill"
                    : "glass-control text-slate-600 hover:text-slate-950"
                )}
                key={item}
                onClick={() => setCategory(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      {filteredResources.length === 0 ? (
        <section className="metric-card p-8 text-center">
          <p className="text-base font-black text-slate-950">No resources found</p>
          <p className="mt-2 text-sm font-medium text-slate-600">
            Try a broader search or switch the category filter.
          </p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filteredResources.map((resource) => (
            <ResourceCard
              isBookmarking={bookmarkResource.isPending}
              key={resource.id}
              onBookmark={handleBookmark}
              onOpen={handleOpen}
              resource={resource}
            />
          ))}
        </section>
      )}

      {isPreferencesOpen ? (
        <ResourcePreferencesModal
          isSaving={updatePreferences.isPending || refreshResources.isPending}
          onClose={() => setIsPreferencesOpen(false)}
          onSave={(preferences) => void handleSavePreferences(preferences)}
          preferences={resourcesData.preferences}
        />
      ) : null}
    </div>
  );
}

function ResourceCard({
  isBookmarking,
  onBookmark,
  onOpen,
  resource,
}: {
  isBookmarking: boolean;
  onBookmark: (resource: CuratedResource) => void;
  onOpen: (resource: CuratedResource) => void;
  resource: CuratedResource;
}) {
  const Icon = RESOURCE_ICON_MAP[resource.type];

  return (
    <article className="metric-card flex min-h-72 flex-col p-5 transition hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <span className="blue-pill inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <button
          aria-label={
            resource.isBookmarked ? "Remove bookmark" : "Bookmark resource"
          }
          className={cn(
            "glass-control inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            resource.isBookmarked ? "text-slate-950" : "text-slate-500"
          )}
          disabled={isBookmarking}
          onClick={() => onBookmark(resource)}
          type="button"
        >
          <Bookmark
            className={cn("h-5 w-5", resource.isBookmarked && "fill-current")}
            aria-hidden="true"
          />
        </button>
      </div>
      <div className="mt-5 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">
            {resource.type}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            {resource.estimatedDuration}
          </span>
          {resource.viewedCount > 0 ? (
            <span className="text-xs font-semibold text-slate-500">
              Viewed {resource.viewedCount}x
            </span>
          ) : null}
        </div>
        <h2 className="mt-3 text-lg font-black leading-6 text-slate-950">
          {resource.title}
        </h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          {resource.creator}
        </p>
        <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
          {resource.description}
        </p>
        <p className="mt-3 rounded-[8px] bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-600">
          {resource.reason}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {resource.tags.map((tag) => (
            <span
              className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-500"
              key={`${resource.id}-${tag}`}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <Button className="mt-5 w-full" onClick={() => onOpen(resource)}>
        Open
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
      </Button>
    </article>
  );
}

function ResourcePreferencesModal({
  isSaving,
  onClose,
  onSave,
  preferences,
}: {
  isSaving: boolean;
  onClose: () => void;
  onSave: (preferences: CuratorResourcePreferences) => void;
  preferences: CuratorResourcePreferences;
}) {
  const [preferredTypes, setPreferredTypes] = useState<CuratorResourceType[]>(
    preferences.preferredTypes
  );
  const [preferredTags, setPreferredTags] = useState(
    preferences.preferredTags.join(", ")
  );

  function toggleType(type: CuratorResourceType) {
    setPreferredTypes((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type]
    );
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <section className="glass-panel w-full max-w-lg rounded-[8px] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-950">
              Content Preferences
            </h2>
            <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
              saarthi.ai will use these preferences the next time it generates
              recommendations.
            </p>
          </div>
          <button
            aria-label="Close preferences"
            className="glass-control inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-5">
          <p className="text-sm font-black text-slate-700">Preferred formats</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {RESOURCE_CATEGORIES.filter(
              (item): item is CuratorResourceType => item !== "All"
            ).map((type) => (
              <button
                className={cn(
                  "inline-flex min-h-10 items-center rounded-full px-4 text-sm font-black",
                  preferredTypes.includes(type)
                    ? "blue-pill"
                    : "glass-control text-slate-600"
                )}
                key={type}
                onClick={() => toggleType(type)}
                type="button"
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <label className="mt-5 block">
          <span className="text-sm font-black text-slate-700">
            Preferred tags
          </span>
          <input
            className="mt-2 h-12 w-full rounded-[8px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none"
            onChange={(event) => setPreferredTags(event.target.value)}
            placeholder="habit, reflection, confidence"
            type="text"
            value={preferredTags}
          />
        </label>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button
            disabled={isSaving}
            onClick={() =>
              onSave({
                preferredTypes,
                preferredTags: preferredTags
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean),
              })
            }
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Settings2 className="h-4 w-4" aria-hidden="true" />
            )}
            Save Preferences
          </Button>
        </div>
      </section>
    </div>
  );
}

function filterResources(
  resources: CuratedResource[],
  search: string,
  category: "All" | CuratorResourceType
) {
  const query = search.trim().toLowerCase();
  return resources.filter((resource) => {
    const matchesCategory = category === "All" || resource.type === category;
    const searchable = [
      resource.title,
      resource.creator,
      resource.description,
      resource.reason,
      resource.type,
      ...resource.tags,
    ]
      .join(" ")
      .toLowerCase();
    return matchesCategory && (!query || searchable.includes(query));
  });
}


function QuizHeader({
  goal,
  topicCount,
}: {
  goal: string;
  topicCount: number;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-slate-900 text-white">
        <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="mt-4 text-sm font-semibold text-blue-600">
        {activeDomain.pages.quiz.eyebrow}
      </p>
      <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">
        {activeDomain.features.quiz}
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        {activeDomain.pages.quiz.description(goal, topicCount)}
      </p>
    </section>
  );
}

function QuizSetting({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-base font-bold text-slate-950">{value}</p>
    </div>
  );
}

function QuizError({ message }: { message: string }) {
  return (
    <section className="rounded-md border border-red-200 bg-red-50 p-4">
      <div className="flex gap-3">
        <AlertTriangle
          className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-semibold text-red-950">
            {activeDomain.pages.quiz.requestFailed}
          </p>
          <p className="mt-1 text-sm leading-6 text-red-800">{message}</p>
        </div>
      </div>
    </section>
  );
}
