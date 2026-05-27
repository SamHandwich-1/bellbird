// Parse the trailing <suggestions> block that Phase 1 Opus is instructed to
// append to every reply (item 15). Each non-empty line within the block is a
// chip rendered by PromptPrefillChips beneath the most recent Opus bubble.
//
// The block is stripped before the body is shown — the user doesn't need to
// see the raw markup.

export type ParsedSuggestions = {
  body: string;
  suggestions: string[];
};

const SUGGESTIONS_RE = /<suggestions>([\s\S]*?)<\/suggestions>/i;

export function parseSuggestions(content: string): ParsedSuggestions {
  const match = content.match(SUGGESTIONS_RE);
  if (!match) return { body: content, suggestions: [] };

  const suggestions = match[1]
    .split('\n')
    .map((s) => s.replace(/^[-*•]\s*/, '').trim())
    .filter((s) => s.length > 0);

  const body = content.replace(SUGGESTIONS_RE, '').trim();
  return { body, suggestions };
}
