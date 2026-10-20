import { describe, it, expect } from "vitest";
import { suggestPriority } from "./useComplaints";
describe("suggestPriority (keyword rule, not ML)", () => {
    it("flags safety keywords as high", () => {
        expect(suggestPriority("Deep hole", "Caused an accident yesterday")).toBe("high");
        expect(suggestPriority("SINKHOLE near school", "")).toBe("high");
    });
    it("flags ordinary damage as medium", () => {
        expect(suggestPriority("Pothole on 5th cross", "")).toBe("medium");
    });
    it("defaults to low", () => {
        expect(suggestPriority("Faded paint", "Lane markings are hard to see")).toBe("low");
    });
    it("high keywords win over medium ones", () => {
        expect(suggestPriority("Pothole", "dangerous for bikes")).toBe("high");
    });
});
