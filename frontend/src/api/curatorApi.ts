import { apiClient } from "@/api/apiClient";
import type {
  CuratorCoachChatApiResponse,
  CuratorCoachConversationApiResponse,
  CuratorCoachConversationsApiResponse,
  CuratorGrowthJourneyApiResponse,
  CuratorOnboardingApiResponse,
  CuratorOnboardingRequest,
  CuratedResource,
  CuratorResourceEngagementApiResponse,
  CuratorResourcePreferences,
  CuratorResourcePreferencesApiResponse,
  CuratorResourcesApiResponse,
  OpportunitiesApiResponse,
  OpportunityEngagementApiResponse,
  OpportunityRecommendation,
} from "@/types/curator";

export async function submitCuratorOnboarding(
  payload: CuratorOnboardingRequest
): Promise<CuratorOnboardingApiResponse> {
  const response = await apiClient.post<CuratorOnboardingApiResponse>(
    "/curator/onboarding",
    payload
  );
  return response.data;
}

export async function getCuratorGrowthJourney(): Promise<CuratorGrowthJourneyApiResponse> {
  const response = await apiClient.get<CuratorGrowthJourneyApiResponse>(
    "/curator/growth-journey"
  );
  return response.data;
}

export async function getCuratorGrowthJourneyToday(): Promise<CuratorGrowthJourneyApiResponse> {
  const response = await apiClient.get<CuratorGrowthJourneyApiResponse>(
    "/curator/growth-journey/today"
  );
  return response.data;
}

export async function completeCuratorGrowthJourneyActivity(
  activityId: string
): Promise<CuratorGrowthJourneyApiResponse> {
  const response = await apiClient.post<CuratorGrowthJourneyApiResponse>(
    "/curator/growth-journey/complete",
    { activityId }
  );
  return response.data;
}

export async function getCuratorCoachConversations(): Promise<CuratorCoachConversationsApiResponse> {
  const response = await apiClient.get<CuratorCoachConversationsApiResponse>(
    "/curator/growth-coach/conversations"
  );
  return response.data;
}

export async function createCuratorCoachConversation(): Promise<CuratorCoachConversationsApiResponse> {
  const response = await apiClient.post<CuratorCoachConversationsApiResponse>(
    "/curator/growth-coach/conversations",
    {}
  );
  return response.data;
}

export async function getCuratorCoachConversation(
  conversationId: number
): Promise<CuratorCoachConversationApiResponse> {
  const response = await apiClient.get<CuratorCoachConversationApiResponse>(
    `/curator/growth-coach/conversations/${conversationId}`
  );
  return response.data;
}

export async function sendCuratorCoachMessage({
  conversationId,
  message,
}: {
  conversationId: number;
  message: string;
}): Promise<CuratorCoachChatApiResponse> {
  const response = await apiClient.post<CuratorCoachChatApiResponse>(
    `/curator/growth-coach/conversations/${conversationId}/messages`,
    { message }
  );
  return response.data;
}

export async function getCuratorResources(
  refresh = false
): Promise<CuratorResourcesApiResponse> {
  const response = await apiClient.get<CuratorResourcesApiResponse>(
    "/curator/resources",
    { params: { refresh } }
  );
  return response.data;
}

export async function bookmarkCuratorResource({
  resource,
  bookmarked,
}: {
  resource: CuratedResource;
  bookmarked: boolean;
}): Promise<CuratorResourceEngagementApiResponse> {
  const response = await apiClient.post<CuratorResourceEngagementApiResponse>(
    "/curator/resources/bookmark",
    { resource, bookmarked }
  );
  return response.data;
}

export async function openCuratorResource(
  resource: CuratedResource
): Promise<CuratorResourceEngagementApiResponse> {
  const response = await apiClient.post<CuratorResourceEngagementApiResponse>(
    "/curator/resources/open",
    { resource }
  );
  return response.data;
}

export async function updateCuratorResourcePreferences(
  preferences: CuratorResourcePreferences
): Promise<CuratorResourcePreferencesApiResponse> {
  const response = await apiClient.put<CuratorResourcePreferencesApiResponse>(
    "/curator/resources/preferences",
    preferences
  );
  return response.data;
}

export async function getCuratorOpportunities(
  refresh = false
): Promise<OpportunitiesApiResponse> {
  const response = await apiClient.get<OpportunitiesApiResponse>(
    "/curator/opportunities",
    { params: { refresh } }
  );
  return response.data;
}

export async function bookmarkCuratorOpportunity({
  opportunity,
  value,
}: {
  opportunity: OpportunityRecommendation;
  value: boolean;
}): Promise<OpportunityEngagementApiResponse> {
  const response = await apiClient.post<OpportunityEngagementApiResponse>(
    "/curator/opportunities/bookmark",
    { opportunity, value }
  );
  return response.data;
}

export async function dismissCuratorOpportunity({
  opportunity,
  value,
}: {
  opportunity: OpportunityRecommendation;
  value: boolean;
}): Promise<OpportunityEngagementApiResponse> {
  const response = await apiClient.post<OpportunityEngagementApiResponse>(
    "/curator/opportunities/dismiss",
    { opportunity, value }
  );
  return response.data;
}
