import { describe, it, expect } from "vitest";
import { getErrorMessage } from "./errors";

describe("getErrorMessage", () => {
  it("reads Error.message", () => expect(getErrorMessage(new Error("boom"))).toBe("boom"));
  it("accepts plain strings", () => expect(getErrorMessage("nope")).toBe("nope"));
  it("reads message from Supabase-style error objects", () =>
    expect(getErrorMessage({ message: "JWT expired", code: "PGRST301" })).toBe("JWT expired"));
  it("falls back for unknown shapes", () => {
    expect(getErrorMessage(undefined)).toBe("Something went wrong");
    expect(getErrorMessage({ message: 42 }, "custom")).toBe("custom");
    expect(getErrorMessage(new Error(""), "empty")).toBe("empty");
  });
});
