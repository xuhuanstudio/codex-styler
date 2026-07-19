import type { CompanionDefinition } from "@codex-styler/theme-core";
import { companionPackageId } from "../companion-creator/companion-id";
import type { CompanionCreatorProject } from "../companion-creator/model";

/**
 * Companion Studio keeps source projects separate from installed packages.
 * The compiler preserves a local project id verbatim or derives a stable
 * package id from the project name and id.
 */
export function findCompanionSourceProject(
  companion: CompanionDefinition | null,
  projects: CompanionCreatorProject[],
): CompanionCreatorProject | null {
  if (!companion) return null;
  return (
    projects.find((project) => companionPackageId(project) === companion.id) ??
    null
  );
}
