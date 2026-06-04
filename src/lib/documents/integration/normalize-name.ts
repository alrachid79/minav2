export function normalizeEntityName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function namesMatch(left: string, right: string): boolean {
  const normalizedLeft = normalizeEntityName(left);
  const normalizedRight = normalizeEntityName(right);

  return (
    normalizedLeft.length > 0 &&
    normalizedRight.length > 0 &&
    normalizedLeft === normalizedRight
  );
}
