import { beforeEach, describe, expect, it } from "vitest";
import { useExperience } from "./experience";

describe("experience store", () => {
  beforeEach(() => {
    useExperience.setState({ progress: 0, mode: "pending" });
  });

  it("clamps progress", () => {
    useExperience.getState().setProgress(1.5);
    expect(useExperience.getState().progress).toBe(1);
  });

  it("switches mode", () => {
    useExperience.getState().setMode("static");
    expect(useExperience.getState().mode).toBe("static");
  });
});
