import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../api/client";
import { authApi } from "../api/endpoints";
import type { NextStep, User } from "../types/api";

export const ME_KEY = ["me"] as const;

/** The signed-in user, or null when signed out. Network errors are surfaced, 401 is not an error. */
export function useMe() {
  return useQuery<User | null>({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        return await authApi.me();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    staleTime: 30_000,
    retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      qc.setQueryData(ME_KEY, null);
      qc.removeQueries({ predicate: (q) => q.queryKey[0] !== "me" });
    },
  });
}

export const STEP_PATH: Record<NextStep, string> = {
  PROFILE: "/onboarding/profile",
  ID_VERIFICATION: "/onboarding/id-verification",
  INTERVIEW: "/dashboard",
};
