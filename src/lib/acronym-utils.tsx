import { ACRONYMS } from "./acronyms";
import { AcronymTooltip } from "@/components/ui/AcronymTooltip";

/**
 * Takes a string and returns React nodes with acronyms wrapped in AcronymTooltip.
 * Only wraps the first occurrence of each acronym in the text.
 */
export function renderWithAcronyms(text: string): React.ReactNode {
  const acronymKeys = Object.keys(ACRONYMS);
  if (acronymKeys.length === 0) return text;

  // Sort by length descending so longer acronyms match first (e.g., "UDOT" before "DOT")
  const sorted = acronymKeys.sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`\\b(${sorted.join("|")})\\b`, "g");

  const matched = new Set<string>();
  const parts: Array<string | { acronym: string; index: number }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const acronym = match[1];

    // Only wrap the first occurrence of each acronym
    if (matched.has(acronym)) continue;
    matched.add(acronym);

    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    parts.push({ acronym, index: match.index });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  // If no acronyms were found, return plain text
  if (parts.length === 1 && typeof parts[0] === "string") {
    return text;
  }

  return (
    <>
      {parts.map((part, i) => {
        if (typeof part === "string") {
          return <span key={i}>{part}</span>;
        }
        return (
          <AcronymTooltip key={`${part.acronym}-${part.index}`} acronym={part.acronym}>
            {part.acronym}
          </AcronymTooltip>
        );
      })}
    </>
  );
}
