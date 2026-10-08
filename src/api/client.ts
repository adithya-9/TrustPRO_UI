/** Thin fetch wrapper. Every API error arrives as {error: {code, message, details}}. */

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown>;

  constructor(status: number, code: string, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Field-level validation messages, if the server returned any. */
  get fields(): Record<string, string> {
    return (this.details.fields as Record<string, string>) ?? {};
  }
}

const NETWORK_MESSAGE = "We couldn't reach TrustPRO. Check your internet connection and try again.";

async function parse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { credentials: "same-origin", ...init });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", NETWORK_MESSAGE);
  }
  const body = (await parse(response)) as { error?: { code: string; message: string; details?: Record<string, unknown> } } | null;
  if (!response.ok) {
    const err = body?.error;
    if (err) throw new ApiError(response.status, err.code, err.message, err.details ?? {});
    if (response.status === 502 || response.status === 504) {
      throw new ApiError(response.status, "SERVER_UNAVAILABLE", "The TrustPRO service is not responding. Please try again shortly.");
    }
    throw new ApiError(response.status, "UNKNOWN", "Something went wrong. Please try again.");
  }
  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, json?: unknown) =>
    request<T>(path, {
      method: "POST",
      headers: json === undefined ? undefined : { "Content-Type": "application/json" },
      body: json === undefined ? undefined : JSON.stringify(json),
    }),
  form: <T>(path: string, data: FormData, method = "POST") => request<T>(path, { method, body: data }),
  put: <T>(path: string, body: BodyInit, contentType?: string) =>
    request<T>(path, { method: "PUT", body, headers: contentType ? { "Content-Type": contentType } : undefined }),
};

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}
