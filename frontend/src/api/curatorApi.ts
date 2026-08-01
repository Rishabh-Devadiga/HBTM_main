import { apiClient } from "@/api/apiClient";
import type {
  CuratorOnboardingApiResponse,
  CuratorOnboardingRequest,
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
