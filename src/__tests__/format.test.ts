import { describe, expect, it } from "vitest";
import { clock, duration, pct, similarity } from "../lib/format";

describe("format helpers", () => {
  it("formats recording offsets as clock times", () => {
    expect(clock(0)).toBe("00:00");
    expect(clock(83_456)).toBe("01:23");
    expect(clock(3_723_000)).toBe("1:02:03");
    expect(clock(null)).toBe("--:--");
  });
  it("formats durations for people", () => {
    expect(duration(3_240)).toBe("3.2 s");
    expect(duration(45_000)).toBe("45 s");
    expect(duration(95_000)).toBe("1 min 35 s");
    expect(duration(120_000)).toBe("2 min");
  });
  it("formats percentages and similarities", () => {
    expect(pct(0.654)).toBe("65%");
    expect(pct(null)).toBe("—");
    expect(similarity(0.4)).toBe("0.40");
  });
});
