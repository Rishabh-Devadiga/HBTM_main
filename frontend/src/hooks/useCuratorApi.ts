import { useMutation } from "@tanstack/react-query";

import { submitCuratorOnboarding } from "@/api/curatorApi";
import type {
  CuratorOnboardingApiResponse,
  CuratorOnboardingRequest,
} from "@/types/curator";

export function useSubmitCuratorOnboarding() {
  return useMutation<
    CuratorOnboardingApiResponse,
    Error,
    CuratorOnboardingRequest
  >({
    mutationFn: submitCuratorOnboarding,
  });
}
