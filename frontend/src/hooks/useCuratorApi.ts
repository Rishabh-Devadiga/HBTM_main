import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  bookmarkCuratorResource,
  completeCuratorGrowthJourneyActivity,
  createCuratorCoachConversation,
  getCuratorGrowthJourney,
  getCuratorCoachConversations,
  getCuratorResources,
  openCuratorResource,
  sendCuratorCoachMessage,
  submitCuratorOnboarding,
  updateCuratorResourcePreferences,
} from "@/api/curatorApi";
import type {
  CuratorCoachChatApiResponse,
  CuratorCoachConversationsApiResponse,
  CuratorGrowthJourneyApiResponse,
  CuratorOnboardingApiResponse,
  CuratorOnboardingRequest,
  CuratedResource,
  CuratorResourceEngagementApiResponse,
  CuratorResourcePreferences,
  CuratorResourcePreferencesApiResponse,
  CuratorResourcesApiResponse,
} from "@/types/curator";

export const curatorQueryKeys = {
  growthJourney: ["curator", "growth-journey"] as const,
  coachConversations: ["curator", "growth-coach", "conversations"] as const,
  resources: ["curator", "resources"] as const,
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

export function useCuratorResources(enabled = true) {
  return useQuery<CuratorResourcesApiResponse, Error>({
    queryKey: curatorQueryKeys.resources,
    queryFn: () => getCuratorResources(false),
    enabled,
  });
}

export function useRefreshCuratorResources() {
  const queryClient = useQueryClient();

  return useMutation<CuratorResourcesApiResponse, Error>({
    mutationFn: () => getCuratorResources(true),
    onSuccess: (response) => {
      queryClient.setQueryData(curatorQueryKeys.resources, response);
    },
  });
}

export function useBookmarkCuratorResource() {
  const queryClient = useQueryClient();

  return useMutation<
    CuratorResourceEngagementApiResponse,
    Error,
    { resource: CuratedResource; bookmarked: boolean }
  >({
    mutationFn: bookmarkCuratorResource,
    onSuccess: (response) => {
      queryClient.setQueryData<CuratorResourcesApiResponse>(
        curatorQueryKeys.resources,
        (current) => updateResourceEngagement(current, response.data)
      );
    },
  });
}

export function useOpenCuratorResource() {
  const queryClient = useQueryClient();

  return useMutation<CuratorResourceEngagementApiResponse, Error, CuratedResource>({
    mutationFn: openCuratorResource,
    onSuccess: (response) => {
      queryClient.setQueryData<CuratorResourcesApiResponse>(
        curatorQueryKeys.resources,
        (current) => updateResourceEngagement(current, response.data)
      );
    },
  });
}

export function useUpdateCuratorResourcePreferences() {
  const queryClient = useQueryClient();

  return useMutation<
    CuratorResourcePreferencesApiResponse,
    Error,
    CuratorResourcePreferences
  >({
    mutationFn: updateCuratorResourcePreferences,
    onSuccess: (response) => {
      queryClient.setQueryData<CuratorResourcesApiResponse>(
        curatorQueryKeys.resources,
        (current) =>
          current
            ? {
                ...current,
                data: {
                  ...current.data,
                  preferences: response.data,
                },
              }
            : current
      );
    },
  });
}

function updateResourceEngagement(
  current: CuratorResourcesApiResponse | undefined,
  engagement: {
    resourceId: string;
    isBookmarked: boolean;
    viewedCount: number;
  }
) {
  if (!current) {
    return current;
  }

  return {
    ...current,
    data: {
      ...current.data,
      resources: current.data.resources.map((resource) =>
        resource.id === engagement.resourceId
          ? {
              ...resource,
              isBookmarked: engagement.isBookmarked,
              viewedCount: engagement.viewedCount,
            }
          : resource
      ),
    },
  };
}
