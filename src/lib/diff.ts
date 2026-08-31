export type DiffTokenType = "same" | "added" | "removed";

export type DiffToken = {
  type: DiffTokenType;
  text: string;
};

function tokenize(text: string): string[] {
  return text.match(/\s+|[^\s]+/g) ?? [];
}

// Word-level diff via LCS. Ad copy is short (a few hundred words at most),
// so the O(n*m) DP table is cheap — no need for a diff library.
export function diffWords(oldText: string, newText: string): DiffToken[] {
  const a = tokenize(oldText);
  const b = tokenize(newText);
  const n = a.length;
  const m = b.length;

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const raw: DiffToken[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      raw.push({ type: "same", text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      raw.push({ type: "removed", text: a[i] });
      i++;
    } else {
      raw.push({ type: "added", text: b[j] });
      j++;
    }
  }
  while (i < n) raw.push({ type: "removed", text: a[i++] });
  while (j < m) raw.push({ type: "added", text: b[j++] });

  return mergeAdjacent(raw);
}

function mergeAdjacent(tokens: DiffToken[]): DiffToken[] {
  const merged: DiffToken[] = [];
  for (const token of tokens) {
    const prev = merged[merged.length - 1];
    if (prev && prev.type === token.type) {
      prev.text += token.text;
    } else {
      merged.push({ ...token });
    }
  }
  return merged;
}
