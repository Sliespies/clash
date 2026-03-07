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
    (has('Blazepods') ? minScore('Blazepods') : 0) +
    (has('Fietsen') ? minScore('Fietsen') : 0) +
    (has('Axethrowing') ? maxScore('Axethrowing') : 0) +
    (has('VR') ? maxScore('VR') * 30 + uniqueNames('VR') * 30 : 0) +
    (has('Icaros') ? 30 * (maxScore('Icaros') + uniqueNames('Icaros')) : 0) +
    (has('Firewall') ? Math.min(maxScore('Firewall') * 10, 90) : 0) +
    (has('MakeyMakey') ? (maxScore('MakeyMakey') > 0 ? 30 : 0) : 0);

  const straf =
    (has('Copycat') ? maxScore('Copycat') : 0) +
    (has('Piccoo') ? maxScore('Piccoo') * 10 : 0) +
    (has('Streetracket') ? maxScore('Streetracket') * 30 + 30 : 0);

  const totaal = bonus - straf;

  return { bonus, straf, totaal };
}
