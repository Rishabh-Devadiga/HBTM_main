import { apiClient, setAuthToken } from "@/api/apiClient";
import type {
  AuthApiResponse,
  AuthStatusApiResponse,
  RegisterApiResponse,
} from "@/types/auth";

export async function registerCuratorUser(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<RegisterApiResponse> {
  const response = await apiClient.post<RegisterApiResponse>(
    "/curator/auth/register",
    payload
  );
  return response.data;
}

export async function loginCuratorUser(payload: {
  email: string;
  password: string;
}): Promise<AuthApiResponse> {
  const response = await apiClient.post<AuthApiResponse>(
    "/curator/auth/login",
    payload
  );
  return response.data;
}

export async function getCuratorAuthStatus(): Promise<AuthStatusApiResponse> {
  const response = await apiClient.get<AuthStatusApiResponse>("/curator/auth/me");
  return response.data;
}

export async function logoutCuratorUser(): Promise<AuthStatusApiResponse> {
  const response = await apiClient.post<AuthStatusApiResponse>(
    "/curator/auth/logout",
    {}
  );
  setAuthToken(null);
  return response.data;
}
