import { describe, expect, it } from "vitest";
import { createCompanionProject } from "./model";
import {
  markEdgeBackdropReviewed,
  resetEdgeReview,
  summarizeEdgeReview,
} from "./quality-review";

describe("companion edge review", () => {
  it("guides the user through black, white and theme surfaces", () => {
    const project = createCompanionProject("local-quality-review");

    expect(summarizeEdgeReview(project)).toMatchObject({
      completed: 0,
      total: 3,
      complete: false,
      next: "black",
    });

    markEdgeBackdropReviewed(project, "black");
    markEdgeBackdropReviewed(project, "white");
    markEdgeBackdropReviewed(project, "theme");
    markEdgeBackdropReviewed(project, "theme");

    expect(summarizeEdgeReview(project)).toEqual({
      reviewed: ["black", "white", "theme"],
      remaining: [],
      completed: 3,
      total: 3,
      complete: true,
      next: null,
    });
  });

  it("invalidates the review after compiled pixels change", () => {
    const project = createCompanionProject("local-quality-reset");
    markEdgeBackdropReviewed(project, "black");

    project.contentScale = 0.82;
    expect(summarizeEdgeReview(project).reviewed).toEqual([]);

    markEdgeBackdropReviewed(project, "black");
    resetEdgeReview(project);

    expect(summarizeEdgeReview(project).reviewed).toEqual([]);
  });
});
