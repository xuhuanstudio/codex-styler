import type { CompanionCreatorProject } from "./model";

export function companionSlug(value: string): string {
  const cleaned = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 32);
  return cleaned.length >= 2 ? cleaned : "companion";
}

export function companionPackageId(
  project: Pick<CompanionCreatorProject, "id" | "name">,
): string {
  return project.id.startsWith("local.")
    ? project.id
    : `local.${companionSlug(project.name)}-${project.id.slice(-8).toLowerCase()}`;
}
