import { builtinCompanions } from "@codex-styler/theme-core";
import { describe, expect, it } from "vitest";
import { createCompanionProject } from "../companion-creator/model";
import { findCompanionSourceProject } from "./companion-project-link";

describe("companion source project links", () => {
  it("matches local ids preserved by the compiler", () => {
    const project = createCompanionProject("local.orbit-fox");
    const companion = structuredClone(builtinCompanions[0]);
    companion.id = project.id;

    expect(findCompanionSourceProject(companion, [project])).toBe(project);
  });

  it("matches generated package ids by the compiler suffix", () => {
    const project = createCompanionProject("project-01HZYX12345678");
    project.name = "Orbit Fox";
    const companion = structuredClone(builtinCompanions[0]);
    companion.id = "local.orbit-fox-12345678";

    expect(findCompanionSourceProject(companion, [project])).toBe(project);
  });

  it("does not invent a source project for imported packages", () => {
    const project = createCompanionProject("project-abcdefgh");
    const companion = structuredClone(builtinCompanions[0]);
    companion.id = "local.imported-companion";

    expect(findCompanionSourceProject(companion, [project])).toBeNull();
  });
});
