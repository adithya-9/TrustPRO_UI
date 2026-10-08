import { api, ApiError } from "./client";
import type { IdCapture, Interview, Profile, RecruiterAccess, User } from "../types/api";

export const authApi = {
  me: () => api.get<User>("/api/auth/me"),
  login: (email: string, password: string) => api.post<User>("/api/auth/login", { email, password }),
  register: (email: string, password: string) => api.post<User>("/api/auth/register", { email, password }),
  logout: () => api.post<{ message: string }>("/api/auth/logout"),
};

export const candidateApi = {
  profile: () => api.get<Profile>("/api/candidate/profile"),
  saveProfile: (data: FormData) => api.form<Profile>("/api/candidate/profile", data, "PUT"),
  verifyId: (capture: Blob) => {
    const data = new FormData();
    data.append("capture", capture, "id-capture.jpg");
    return api.form<IdCapture>("/api/candidate/id-verifications", data);
  },
  confirmId: (verificationId: number) => api.post<IdCapture>(`/api/candidate/id-verifications/${verificationId}/confirm`),
  latestCapture: () => api.get<IdCapture | null>("/api/candidate/id-verifications/latest"),
};

export const recruiterApi = {
  me: () => api.get<RecruiterAccess>("/api/recruiter/me"),
  login: (loginId: string, password: string) => api.post<RecruiterAccess>("/api/recruiter/login", { email: loginId, password }),
  logout: () => api.post<{ message: string }>("/api/recruiter/logout"),
  /** The report is server-generated HTML, so it is read as text rather than JSON. */
  reportHtml: async () => {
    const response = await fetch("/api/recruiter/report", { credentials: "same-origin" });
    if (response.ok) return response.text();
    const body = await response.json().catch(() => null) as { error?: { code: string; message: string } } | null;
    throw new ApiError(response.status, body?.error?.code ?? "UNKNOWN", body?.error?.message ?? "The report could not be loaded.");
  },
};

export const interviewApi = {
  list: () => api.get<Interview[]>("/api/interviews"),
  get: (id: number) => api.get<Interview>(`/api/interviews/${id}`),
  create: () => api.post<Interview>("/api/interviews"),
  start: (id: number) => api.post<Interview>(`/api/interviews/${id}/start`),
  uploadChunk: (id: number, seq: number, blob: Blob) =>
    api.put<{ next_seq: number; bytes_received: number }>(`/api/interviews/${id}/recording/chunks/${seq}`, blob, "video/webm"),
  end: (id: number, durationMs: number, chunkCount: number) =>
    api.post<Interview>(`/api/interviews/${id}/end`, { duration_ms: durationMs, chunk_count: chunkCount }),
};
