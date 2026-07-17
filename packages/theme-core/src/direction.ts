export function pointerDirectionFrame(
  pointerX: number,
  pointerY: number,
  anchorX: number,
  anchorY: number,
  directions: number,
  frameAngles?: number[],
): number {
  const radians = Math.atan2(pointerY - anchorY, pointerX - anchorX);
  const normalized = (radians + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
  if (frameAngles?.length === directions) {
    const degrees = (normalized * 180) / Math.PI;
    let selected = 0;
    let selectedDistance = Number.POSITIVE_INFINITY;
    for (let index = 0; index < frameAngles.length; index += 1) {
      const rawDistance = Math.abs(frameAngles[index] - degrees);
      const distance = Math.min(rawDistance, 360 - rawDistance);
      if (distance < selectedDistance) {
        selected = index;
        selectedDistance = distance;
      }
    }
    return selected;
  }
  return Math.round(normalized / ((Math.PI * 2) / directions)) % directions;
}
