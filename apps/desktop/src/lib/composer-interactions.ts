export const composerInteractionModes = [
  "disabled",
  "marbles",
  "claw",
  "toss",
  "balance",
  "route",
] as const;

export type ComposerInteractionMode = (typeof composerInteractionModes)[number];

export function isComposerInteractionMode(
  value: unknown,
): value is ComposerInteractionMode {
  return composerInteractionModes.includes(value as ComposerInteractionMode);
}
