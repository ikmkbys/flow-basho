export type HistoryEntry = { id: string; title: string; createdAt: number };

function safeParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try { return JSON.parse(json) as T; } catch { return fallback; }
}

export const storage = {
  getHistory: (): HistoryEntry[] =>
    safeParse(localStorage.getItem('basho_history'), []),

  setHistory: (entries: HistoryEntry[]): void =>
    localStorage.setItem('basho_history', JSON.stringify(entries)),
};
