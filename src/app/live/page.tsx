'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { EVENTS } from '@/lib/events';
import { calculateStats } from '@/lib/scoring';

interface CompanyData {
  company: string;
  startTime: number | null;  // epoch ms, null = not started
  stoppedElapsed: number | null; // seconds, null = still running
  bonus: number;
  straf: number;
  totaal: number;
  scores: Record<string, { best: number; participants: number }>;
}

interface HighScoreEntry {
  score: number;
  company: string;
}

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

const formatTime = (s: number) => {
  const h = Math.floor(Math.abs(s) / 3600);
  const m = Math.floor((Math.abs(s) % 3600) / 60);
  const sec = Math.floor(Math.abs(s) % 60);
  const sign = s < 0 ? '-' : '';
  return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

function getTimerSeconds(c: CompanyData): number {
  if (c.stoppedElapsed !== null) return c.stoppedElapsed;
  if (c.startTime) return Math.floor((Date.now() - c.startTime) / 1000);
  return 0;
}

function isRunning(c: CompanyData): boolean {
  return c.startTime !== null && c.stoppedElapsed === null;
}

export default function LiveDashboard() {
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [highScores, setHighScores] = useState<Record<string, HighScoreEntry>>({});
  const [activeCompany, setActiveCompany] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [, setTick] = useState(0); // force re-render every second

  // Haal actief bedrijf uit localStorage (zelfde sessie als trainer login)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('clash-session');
      if (saved) {
        const { company } = JSON.parse(saved);
        if (company) setActiveCompany(company);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [scoresRes, timerRes] = await Promise.all([
        fetch('/api/sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get', range: 'Scores!A:E' }),
        }),
        fetch('/api/sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get', range: 'Timer!A:D', valueRenderOption: 'UNFORMATTED_VALUE', dateTimeRenderOption: 'FORMATTED_STRING' }),
        }),
      ]);

      const scoresData = await scoresRes.json();
      const timerData = await timerRes.json();

      if (!scoresRes.ok || !timerRes.ok) return;

      const scoreRows: string[][] = scoresData.values || [];
      const timerRows: string[][] = timerData.values || [];

      const companyNames = [...new Set([
        ...timerRows.map(r => r[0]),
        ...scoreRows.map(r => r[0]),
      ].filter(v => v && v !== 'Company' && v !== 'Bedrijf' && v !== 'Bedrijfsnaam'))];

      const data: CompanyData[] = companyNames.map((company) => {
        const { bonus, straf, totaal } = calculateStats(scoreRows, company);

        const timerRow = timerRows.find(r => r[0] === company);
        let startTime: number | null = null;
        let stoppedElapsed: number | null = null;
        if (timerRow) {
          if (timerRow[1]) {
            startTime = new Date(timerRow[1]).getTime();
          }
          if (timerRow[2]) {
            // Calculate elapsed from start/stop times
            if (startTime) {
              stoppedElapsed = Math.floor((new Date(timerRow[2]).getTime() - startTime) / 1000);
            } else {
              stoppedElapsed = 0;
            }
          }
        }

        // Per-event scores for this company
        const scores: Record<string, { best: number; participants: number }> = {};
        for (const event of EVENTS) {
          const eventRows = scoreRows.filter(r => r[0] === company && r[2] === event.name);
          if (eventRows.length > 0) {
            const values = eventRows.map(r => Number(r[3])).filter(v => !isNaN(v));
            const names = new Set(eventRows.map(r => r[1]).filter(Boolean));
            if (values.length > 0) {
              const best = event.type === 'time'
                ? Math.min(...values)
                : Math.max(...values);
              scores[event.name] = { best, participants: names.size };
            }
          }
        }

        return {
          company,
          startTime,
          stoppedElapsed,
          bonus,
          straf,
          totaal,
          scores,
        };
      });

      data.sort((a, b) => getTimerSeconds(a) + a.totaal - (getTimerSeconds(b) + b.totaal));

      // Compute high scores across all companies
      const hs: Record<string, HighScoreEntry> = {};
      for (const event of EVENTS) {
        let best: number | null = null;
        let bestCompany = '';
        for (const c of data) {
          const s = c.scores[event.name];
          if (!s) continue;
          const isBetter = best === null ||
            (event.type === 'time' ? s.best < best : s.best > best);
          if (isBetter) {
            best = s.best;
            bestCompany = c.company;
          }
        }
        if (best !== null) {
          hs[event.name] = { score: best, company: bestCompany };
        }
      }
      setHighScores(hs);

      setCompanies(data);
      setLastUpdate(new Date());
    } catch (e) {
      console.error('Live dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Tick every second to update running timers
  useEffect(() => {
    const hasRunning = companies.some(c => isRunning(c));
    if (!hasRunning) return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [companies]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500 text-lg">Dashboard laden...</p>
      </div>
    );
  }

  // Active company: from localStorage, or the one with a running timer, or the first company
  const active = (() => {
    if (activeCompany) {
      const found = companies.find(c => c.company === activeCompany);
      if (found) return found;
    }
    const running = companies.find(c => isRunning(c));
    if (running) return running;
    return companies.length > 0 ? companies[0] : null;
  })();

  return (
    <div className="fixed inset-0 bg-gray-950 text-white p-6 lg:px-10 lg:py-6 flex flex-col overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <img src="/logo.svg" alt="Logo" className="h-12 lg:h-14 w-auto" />
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Live Scorebord</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-gray-300 text-sm">
            {lastUpdate ? `Bijgewerkt ${lastUpdate.toLocaleTimeString('nl-BE')}` : ''}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Klassement */}
        <div className="xl:col-span-1 flex flex-col">
          <h2 className="text-base font-semibold text-white uppercase tracking-wide mb-3">Klassement</h2>

          {/* Timer & Stats voor het actieve bedrijf */}
          {active && (isRunning(active) || getTimerSeconds(active) > 0) && (
            <div className="bg-gray-900 border border-amber-500/30 rounded-xl p-4 mb-3 flex items-center gap-5">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  {isRunning(active) && <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                  <span className="text-xs text-gray-200 font-medium">{active.company}</span>
                </div>
                <div className={`text-3xl font-bold tabular-nums ${
                  isRunning(active) ? 'text-amber-500' : 'text-emerald-500'
                }`}>
                  {formatTime(getTimerSeconds(active))}
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <div className="text-gray-300 text-xs">Bonus</div>
                  <div className="text-emerald-400 font-bold">{active.bonus}s</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-300 text-xs">Straf</div>
                  <div className="text-red-400 font-bold">{active.straf}s</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-300 text-xs">Totaal</div>
                  <div className="text-indigo-400 font-bold">{formatTime(getTimerSeconds(active) + active.totaal)}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col justify-evenly gap-2">
            {companies.map((c, i) => {
              const rank = i + 1;
              const medalColor = rank <= 3 ? MEDAL_COLORS[rank - 1] : undefined;
              return (
                <div
                  key={c.company}
                  className="bg-gray-900 rounded-xl px-4 py-3 flex items-center gap-4"
                  style={medalColor ? { borderLeft: `4px solid ${medalColor}` } : { borderLeft: '4px solid transparent' }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-base shrink-0"
                    style={{ backgroundColor: medalColor || '#374151', color: medalColor ? '#111' : '#E5E7EB' }}
                  >
                    {rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-base truncate">{c.company}</div>
                    <div className="text-xs text-gray-300">
                      Bonus {c.bonus}s &middot; Straf {c.straf}s
                      {isRunning(c) && <span className="text-amber-500 ml-2">&#9679; Timer loopt</span>}
                      {!isRunning(c) && getTimerSeconds(c) > 0 && <span className="text-emerald-500 ml-2">&#10003; Klaar</span>}
                    </div>
                  </div>
                  <div className="font-mono text-xl font-bold tabular-nums shrink-0" style={{ color: medalColor || '#D1D5DB' }}>
                    {formatTime(getTimerSeconds(c) + c.totaal)}
                  </div>
                </div>
              );
            })}
            {companies.length === 0 && (
              <p className="text-gray-400 text-center py-4">Nog geen teams gestart</p>
            )}
          </div>
        </div>

        {/* Scores per challenge */}
        <div className="xl:col-span-2 flex flex-col">
          <h2 className="text-base font-semibold text-white uppercase tracking-wide mb-3">Scores per Challenge</h2>
          <table className="w-full text-base flex-1">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-2 px-3 text-gray-300 font-medium">Challenge</th>
                {active && (
                  <th className="text-center py-2 px-3 text-gray-300 font-semibold">{active.company}</th>
                )}
                <th className="text-center py-2 px-3 text-amber-500 font-semibold">High Score</th>
              </tr>
            </thead>
            <tbody>
              {EVENTS.map((event) => {
                const hs = highScores[event.name];
                const myScore = active?.scores[event.name];
                const isBest = myScore && hs && myScore.best === hs.score;

                return (
                  <tr key={event.name} className="border-b border-gray-800/50">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <img src={event.icon} alt="" className="w-5 h-5 invert opacity-80" />
                        <span className="font-medium">{event.name}</span>
                      </div>
                    </td>
                    {active && (
                      <td className="text-center py-2 px-3">
                        {myScore ? (
                          <span className={`font-mono font-semibold ${isBest ? 'text-emerald-400' : 'text-gray-300'}`}>
                            {myScore.best}{event.type === 'time' ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                    )}
                    <td className="text-center py-2 px-3">
                      {hs ? (
                        <div>
                          <span className="font-mono font-bold text-amber-400">
                            {hs.score}{event.type === 'time' ? 's' : ''}
                          </span>
                          <span className="text-xs text-gray-300 ml-2">
                            {hs.company}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
