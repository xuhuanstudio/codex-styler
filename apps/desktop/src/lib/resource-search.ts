export function normalizeResourceSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase()
    .trim();
}

export function matchesResourceSearch(
  query: string,
  fields: Array<string | undefined>,
): boolean {
  const normalizedQuery = normalizeResourceSearchText(query);
  if (!normalizedQuery) return true;

  const haystack = normalizeResourceSearchText(fields.filter(Boolean).join(" "));
  return normalizedQuery
    .split(/\s+/)
    .every((term) => haystack.includes(term));
}
