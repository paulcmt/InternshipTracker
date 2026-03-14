/**
 * LinkedIn search URL helpers (no extraction, manual lookup).
 */

/**
 * Build LinkedIn company search URL (opens in new tab for manual lookup).
 */
export function buildLinkedInCompanySearchUrl(name: string): string {
  const q = encodeURIComponent(name.trim());
  return `https://www.linkedin.com/search/results/companies/?keywords=${q}`;
}

/**
 * Build LinkedIn people search URL (opens in new tab for manual lookup).
 * Query is typically "personName companyName" or just companyName.
 */
export function buildLinkedInPeopleSearchUrl(query: string): string {
  const q = encodeURIComponent(query.trim());
  return `https://www.linkedin.com/search/results/people/?keywords=${q}`;
}
