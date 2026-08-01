import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  completeCuratorGrowthJourneyActivity,
  createCuratorCoachConversation,
  getCuratorGrowthJourney,
  getCuratorCoachConversations,
  sendCuratorCoachMessage,
  submitCuratorOnboarding,
} from "@/api/curatorApi";
import type {
  CuratorCoachChatApiResponse,
  CuratorCoachConversationsApiResponse,
  CuratorGrowthJourneyApiResponse,
  CuratorOnboardingApiResponse,
  CuratorOnboardingRequest,
} from "@/types/curator";

export const curatorQueryKeys = {
  growthJourney: ["curator", "growth-journey"] as const,
  coachConversations: ["curator", "growth-coach", "conversations"] as const,
};

export function useSubmitCuratorOnboarding() {
  return useMutation<
    CuratorOnboardingApiResponse,
    Error,
    CuratorOnboardingRequest
  >({
    mutationFn: submitCuratorOnboarding,
  });
}

export function useCuratorGrowthJourney(enabled = true) {
  return useQuery<CuratorGrowthJourneyApiResponse, Error>({
    queryKey: curatorQueryKeys.growthJourney,
    queryFn: getCuratorGrowthJourney,
    enabled,
  });
}

export function useCompleteCuratorJourneyActivity() {
  const queryClient = useQueryClient();

  return useMutation<CuratorGrowthJourneyApiResponse, Error, string>({
    mutationFn: completeCuratorGrowthJourneyActivity,
    onSuccess: (response) => {
      queryClient.setQueryData(curatorQueryKeys.growthJourney, response);
    },
  });
}

export function useCuratorCoachConversations(enabled = true) {
  return useQuery<CuratorCoachConversationsApiResponse, Error>({
    queryKey: curatorQueryKeys.coachConversations,
    queryFn: getCuratorCoachConversations,
    enabled,
  });
}

export function useCreateCuratorCoachConversation() {
  const queryClient = useQueryClient();

  return useMutation<CuratorCoachConversationsApiResponse, Error>({
    mutationFn: createCuratorCoachConversation,
    onSuccess: (response) => {
      queryClient.setQueryData(curatorQueryKeys.coachConversations, response);
    },
  });
}

export function useSendCuratorCoachMessage() {
  const queryClient = useQueryClient();

  return useMutation<
    CuratorCoachChatApiResponse,
    Error,
    { conversationId: number; message: string }
  >({
    mutationFn: sendCuratorCoachMessage,
    onSuccess: (response) => {
      queryClient.setQueryData<CuratorCoachConversationsApiResponse>(
        curatorQueryKeys.coachConversations,
        (current) => {
          if (!current) {
            return current;
          }
          const conversation = response.data.conversation;
          const conversations = current.data.conversations.some(
            (item) => item.id === conversation.id
          )
            ? current.data.conversations.map((item) =>
                item.id === conversation.id
                  ? {
                      id: conversation.id,
                      title: conversation.title,
                      createdAt: conversation.createdAt,
                      updatedAt: conversation.updatedAt,
                    }
                  : item
              )
            : [
                {
                  id: conversation.id,
                  title: conversation.title,
                  createdAt: conversation.createdAt,
                  updatedAt: conversation.updatedAt,
                },
                ...current.data.conversations,
              ];

          return {
            ...current,
            data: {
              ...current.data,
              conversations,
              activeConversation: conversation,
              suggestedPrompts: response.data.suggestedPrompts,
            },
          };
        }
      );
    },
  });
}
