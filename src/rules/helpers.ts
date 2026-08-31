export function findAll(content: string, regex: RegExp): RegExpMatchArray[] {
  if (!regex.global) {
    throw new Error(`findAll requires a global regex: ${regex}`);
  }
  return [...content.matchAll(regex)];
}

export function hasPhrase(content: string, phrase: string): boolean {
  return content.toLowerCase().includes(phrase.toLowerCase());
}

/**
 * Span of the last sentence in `content`. Used to anchor flags for
 * "required element is missing" rules, where there's no offending phrase to
 * point at — the flag highlights the end of the ad, where the missing
 * disclosure should be added.
 */
export function lastSentenceSpan(content: string): { start: number; end: number } {
  const trimmed = content.trimEnd();
  const sentences = [...trimmed.matchAll(/[^.!?]+[.!?]*/g)];
  const last = sentences[sentences.length - 1];
  if (!last || last.index === undefined) {
    return { start: 0, end: trimmed.length };
  }
  const raw = last[0];
  const leadingWhitespace = raw.length - raw.trimStart().length;
  const start = last.index + leadingWhitespace;
  const end = last.index + raw.trimEnd().length;
  return { start, end };
}
