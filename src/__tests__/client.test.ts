import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, errorMessage, request } from "../api/client";

const respond = (status: number, body: unknown) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(body), { status }));

afterEach(() => vi.restoreAllMocks());

describe("api client", () => {
  it("returns parsed JSON on success", async () => {
    respond(200, { ok: true });
    await expect(request("/api/x")).resolves.toEqual({ ok: true });
  });

  it("turns API errors into ApiError with field messages", async () => {
    respond(422, { error: { code: "VALIDATION_ERROR", message: "Invalid", details: { fields: { email: "Enter a valid email address." } } } });
    const err = (await request("/api/x").catch((e: unknown) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.fields.email).toBe("Enter a valid email address.");
  });

  it("gives a friendly message when the network fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));
    const err = (await request("/api/x").catch((e: unknown) => e)) as ApiError;
    expect(err.code).toBe("NETWORK_ERROR");
    expect(errorMessage(err)).toMatch(/couldn't reach TrustPRO/);
  });

  it("explains a missing backend behind the dev proxy", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 502 }));
    const err = (await request("/api/x").catch((e: unknown) => e)) as ApiError;
    expect(err.code).toBe("SERVER_UNAVAILABLE");
  });
});
