export function pointerDirectionFrame(
  pointerX: number,
  pointerY: number,
  anchorX: number,
  anchorY: number,
  directions: 4 | 8 | 16,
): number {
  const radians = Math.atan2(pointerY - anchorY, pointerX - anchorX);
  const normalized = (radians + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
  return Math.round(normalized / ((Math.PI * 2) / directions)) % directions;
}

