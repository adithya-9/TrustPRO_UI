import { useQuery } from "@tanstack/react-query";
import { ApiError } from "../../api/client";
import { recruiterApi } from "../../api/endpoints";
import type { RecruiterAccess } from "../../types/api";

export const RECRUITER_KEY = ["recruiter", "me"] as const;

/** The signed-in recruiter login, or null when signed out or expired. */
export function useRecruiter() {
  return useQuery<RecruiterAccess | null>({
    queryKey: RECRUITER_KEY,
    queryFn: async () => {
      try {
        return await recruiterApi.me();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    retry: false,
  });
}
