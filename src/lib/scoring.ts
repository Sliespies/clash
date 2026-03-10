interface EventData {
  scores: number[];
  names: Set<string>;
}

export interface Stats {
  bonus: number;
  straf: number;
  totaal: number;
}

export function calculateStats(rows: string[][], company: string): Stats {
  const companyRows = rows.filter((r) => r[0] === company);

  const byEvent: Record<string, EventData> = {};
  for (const row of companyRows) {
    const eventName = row[2];
    const score = Number(row[3]);
    const name = row[1];
    if (!eventName || isNaN(score)) continue;
    if (!byEvent[eventName]) byEvent[eventName] = { scores: [], names: new Set() };
    byEvent[eventName].scores.push(score);
    byEvent[eventName].names.add(name);
  }

  const maxScore = (ev: string) => (byEvent[ev] ? Math.max(...byEvent[ev].scores) : 0);
  const minScore = (ev: string) => (byEvent[ev] ? Math.min(...byEvent[ev].scores) : 0);
  const uniqueNames = (ev: string) => (byEvent[ev] ? byEvent[ev].names.size : 0);
  const has = (ev: string) => !!byEvent[ev];

  const bonus =
    (has('Axethrowing') ? maxScore('Axethrowing') : 0) +
    (has('VR') ? maxScore('VR') * 30 + uniqueNames('VR') * 30 : 0) +
    (has('Icaros') ? 30 * (maxScore('Icaros') + uniqueNames('Icaros')) : 0) +
    (has('Firewall') ? Math.min(maxScore('Firewall') * 10, 90) : 0) +
    (has('MakeyMakey') ? (maxScore('MakeyMakey') > 0 ? 30 : 0) : 0) +
    (has('Streetracket') ? maxScore('Streetracket') * 30 + 30 : 0) +
    (has('Copycat') ? maxScore('Copycat') : 0) +
    (has('Roeien') ? Math.floor(maxScore('Roeien') / 5) : 0);

  const straf =
    (has('Blazepods') ? minScore('Blazepods') : 0) +
    (has('Piccoo') ? maxScore('Piccoo') * 10 : 0) +
    (has('Fietsen') ? minScore('Fietsen') : 0);

  const totaal = straf - bonus;

  return { bonus, straf, totaal };
}

export interface HighScore {
  score: number;
  name: string;
  company: string;
}

const DEFAULT_HIGH_SCORES: Record<string, number> = {
  Blazepods: 45,
  Copycat: 35,
  Fietsen: 43,
  VR: 3,
  Icaros: 15,
  Firewall: 2,
  Axethrowing: 170,
  Piccoo: 3,
  MakeyMakey: 2436,
  Streetracket: 9,
  Roeien: 4598,
};

export function getHighScores(
  rows: string[][],
  events: { name: string; type: 'time' | 'number' }[]
): Record<string, HighScore> {
  const result: Record<string, HighScore> = {};

  for (const event of events) {
    const defaultScore = DEFAULT_HIGH_SCORES[event.name];
    let bestScore: number | null = defaultScore ?? null;
    let bestName = defaultScore != null ? 'Target' : '';
    let bestCompany = defaultScore != null ? 'Target' : '';

    for (const row of rows) {
      if (row[2] !== event.name) continue;
      const score = Number(row[3]);
      if (isNaN(score)) continue;

      const isBetter =
        bestScore === null ||
        (event.type === 'time' ? score < bestScore : score > bestScore);

      if (isBetter) {
        bestScore = score;
        bestName = row[1];
        bestCompany = row[0];
      }
    }

    if (bestScore !== null) {
      result[event.name] = { score: bestScore, name: bestName, company: bestCompany };
    }
  }

  return result;
}
