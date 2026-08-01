import { AlertTriangle, Bot, RefreshCw, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/common/Button";
import { MentorChat } from "@/components/mentor/MentorChat";
import { useSession } from "@/context/SessionContext";
import { activeDomain } from "@/domain";
import {
  useCreateCuratorCoachConversation,
  useCuratorCoachConversations,
  useSendCuratorCoachMessage,
} from "@/hooks/useCuratorApi";
import { sendMentorMessage } from "@/services/mentorService";
import type { MentorMessage } from "@/types/mentor";

type FailedRequest = {
  history: MentorMessage[];
  message: string;
};

export function AIMentorPage() {
  if (activeDomain.id === "curator") {
    return <CuratorGrowthCoachPage />;
  }

  return <LearningAIMentorPage />;
}

function LearningAIMentorPage() {
  const { state } = useSession();
  const [messages, setMessages] = useState<MentorMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [failedRequest, setFailedRequest] = useState<FailedRequest | null>(null);
  const learningGoal =
    state.intent?.learning_goal ?? state.learningPlan?.learning_goal ?? null;
  const currentTopic = useMemo(() => getCurrentTopic(state), [state]);
  const mentorMutation = useMutation({
    mutationFn: sendMentorMessage,
  });

  async function sendMessage(
    message: string,
    history: MentorMessage[] = messages,
    appendUserMessage = true
  ) {
    if (!message.trim() || mentorMutation.isPending) {
      return;
    }

    const trimmedMessage = message.trim();
    setFailedRequest(null);
    setSuggestions([]);
    if (appendUserMessage) {
      setMessages((currentMessages) => [
        ...currentMessages,
        { role: "user", content: trimmedMessage },
      ]);
    }

    try {
      const response = await mentorMutation.mutateAsync({
        message: trimmedMessage,
        learning_goal: learningGoal,
        current_topic: currentTopic,
        conversation_history: history,
      });
      setMessages((currentMessages) => [
        ...currentMessages,
        { role: "assistant", content: response.data.reply },
      ]);
      setSuggestions(response.data.suggested_followups);
    } catch {
      setFailedRequest({ history, message: trimmedMessage });
    }
  }

  return (
    <div className="mx-auto max-w-[960px] space-y-5">
      <header className="rounded-md border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-md bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-md shadow-blue-100">
            <Bot className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
              {activeDomain.features.mentor}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {activeDomain.pages.mentor.description}
            </p>
          </div>
        </div>
      </header>

      <MentorChat
        isLoading={mentorMutation.isPending}
        messages={messages}
        onSend={(message) => void sendMessage(message)}
        suggestions={suggestions}
      />

      {failedRequest ? (
        <div
          className="fixed bottom-5 right-5 z-50 w-[min(92vw,400px)] rounded-md border border-red-200 bg-white p-4 shadow-2xl"
          role="alert"
        >
          <div className="flex gap-3">
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-950">
                {activeDomain.pages.mentor.unavailableTitle}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Your conversation is still here. Retry when the service is
                available.
              </p>
              <Button
                className="mt-3"
                disabled={mentorMutation.isPending}
                onClick={() =>
                  void sendMessage(
                    failedRequest.message,
                    failedRequest.history,
                    false
                  )
                }
                size="default"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Retry
              </Button>
            </div>
            <button
              aria-label="Dismiss error"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              onClick={() => setFailedRequest(null)}
              type="button"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CuratorGrowthCoachPage() {
  const conversationsQuery = useCuratorCoachConversations();
  const createConversation = useCreateCuratorCoachConversation();
  const sendCoachMessage = useSendCuratorCoachMessage();
  const [failedRequest, setFailedRequest] = useState<string | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<MentorMessage[]>([]);

  const activeConversation =
    conversationsQuery.data?.data.activeConversation ?? null;
  const persistedMessages = activeConversation?.messages ?? [];
  const messages = [
    ...persistedMessages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
    })),
    ...optimisticMessages,
  ];
  const suggestions = conversationsQuery.data?.data.suggestedPrompts ?? [];
  const isLoading =
    conversationsQuery.isLoading ||
    createConversation.isPending ||
    sendCoachMessage.isPending;

  async function startNewConversation() {
    if (createConversation.isPending) {
      return;
    }
    setFailedRequest(null);
    setOptimisticMessages([]);
    await createConversation.mutateAsync();
  }

  async function sendMessage(message: string) {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isLoading) {
      return;
    }

    setFailedRequest(null);
    setOptimisticMessages([{ role: "user", content: trimmedMessage }]);
    try {
      const conversationId =
        activeConversation?.id ??
        (await createConversation.mutateAsync()).data.activeConversation?.id;
      if (!conversationId) {
        throw new Error("Growth Coach conversation was not created.");
      }
      await sendCoachMessage.mutateAsync({
        conversationId,
        message: trimmedMessage,
      });
      setOptimisticMessages([]);
    } catch {
      setFailedRequest(trimmedMessage);
    }
  }

  return (
    <div className="mx-auto max-w-[960px] space-y-5">
      <header className="rounded-md border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-md shadow-blue-100">
              <Bot className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
                {activeDomain.features.mentor}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {activeDomain.pages.mentor.description}
              </p>
            </div>
          </div>
          <Button
            disabled={isLoading}
            onClick={() => void startNewConversation()}
            size="default"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            New Conversation
          </Button>
        </div>
      </header>

      {conversationsQuery.isError ? (
        <div
          className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          role="alert"
        >
          Unable to load Growth Coach.
        </div>
      ) : (
        <MentorChat
          isLoading={isLoading}
          messages={messages}
          onSend={(message) => void sendMessage(message)}
          starterPrompts={suggestions}
          suggestions={suggestions}
        />
      )}

      {failedRequest ? (
        <div
          className="fixed bottom-5 right-5 z-50 w-[min(92vw,400px)] rounded-md border border-red-200 bg-white p-4 shadow-2xl"
          role="alert"
        >
          <div className="flex gap-3">
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-950">
                {activeDomain.pages.mentor.unavailableTitle}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Your conversation is still here. Retry when the service is
                available.
              </p>
              <Button
                className="mt-3"
                disabled={isLoading}
                onClick={() => void sendMessage(failedRequest)}
                size="default"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Retry
              </Button>
            </div>
            <button
              aria-label="Dismiss error"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              onClick={() => setFailedRequest(null)}
              type="button"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getCurrentTopic(
  state: ReturnType<typeof useSession>["state"]
): string | null {
  const plan = state.learningPlan;
  if (!plan) {
    return null;
  }

  const currentPhase =
    plan.phases.find(
      (phase) => phase.phase_number === state.progress?.current_phase
    ) ?? plan.phases[0];
  if (!currentPhase) {
    return null;
  }

  return (
    currentPhase.recommended_topics.find((topic) =>
      state.progress?.remaining_topics.includes(topic)
    ) ??
    currentPhase.recommended_topics[0] ??
    null
  );
}
