/**
 * Skill-domain accent lookup. Tailwind's scanner only detects
 * statically-written class strings, so these literals must stay written
 * out in full here even though they're selected by a runtime key — see
 * apps/web/src/styles/TOKENS.md.
 */
export const domainBadgeClassName: Record<string, string> = {
  quant: "bg-domain-quant",
  ielts: "bg-domain-ielts",
  js: "bg-domain-js",
  stats: "bg-domain-stats",
  dl: "bg-domain-dl",
};

export function domainClassName(slug: string): string {
  return domainBadgeClassName[slug] ?? "bg-foreground-muted";
}
