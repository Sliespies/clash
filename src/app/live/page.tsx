'use client';

import { useState, useEffect, useCallback } from 'react';
import { EVENTS } from '@/lib/events';
import { calculateStats, capBonus } from '@/lib/scoring';

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

type Theme = 'dark' | 'light';

interface ThemeStyles {
  page: string;
  loadingPage: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  headingSub: string;
  infoPanel: string;
  infoText: string;
  infoMuted: string;
  activePanel: string;
  activeLabel: string;
  statLabel: string;
  rankRow: string;
  rankBadgeBg: string;
  rankBadgeText: string;
  rankSubtext: string;
  rankEndTime: string;
  tableHeadBorder: string;
  tableHead: string;
  tableRowBorder: string;
  iconInvert: string;
  toggleOn: string;
  toggleOff: string;
  themeBtn: string;
  emptyText: string;
  overlayBg: string;
  overlayStickyBg: string;
  overlayHeadBorder: string;
  overlayRowBorder: string;
  overlayHeadText: string;
  overlayChallenge: string;
  overlayScore: string;
  overlayScoreDim: string;
  overlayBestBorder: string;
  overlayEndtotaalText: string;
  closeBtn: string;
}

const THEMES: Record<Theme, ThemeStyles> = {
  dark: {
    page: 'bg-gray-950 text-white',
    loadingPage: 'bg-gray-950 text-gray-500',
    textPrimary: 'text-white',
    textSecondary: 'text-gray-300',
    textMuted: 'text-gray-400',
    headingSub: 'text-white',
    infoPanel: 'bg-gray-900/60',
    infoText: 'text-gray-300',
    infoMuted: 'text-gray-400',
    activePanel: 'bg-gray-900 border border-amber-500/30',
    activeLabel: 'text-gray-200',
    statLabel: 'text-gray-300',
    rankRow: 'bg-gray-900',
    rankBadgeBg: '#374151',
    rankBadgeText: '#E5E7EB',
    rankSubtext: 'text-gray-300',
    rankEndTime: '#D1D5DB',
    tableHeadBorder: 'border-b border-gray-800',
    tableHead: 'text-gray-300',
    tableRowBorder: 'border-b border-gray-800/50',
    iconInvert: 'invert opacity-80',
    toggleOn: 'bg-amber-500 text-gray-950',
    toggleOff: 'bg-gray-800 text-gray-300 hover:bg-gray-700',
    themeBtn: 'bg-gray-800 text-gray-300 hover:bg-gray-700',
    emptyText: 'text-gray-400',
    overlayBg: 'bg-gray-950/95',
    overlayStickyBg: 'bg-gray-950',
    overlayHeadBorder: 'border-b border-gray-700',
    overlayRowBorder: 'border-b border-gray-800/50',
    overlayHeadText: 'text-gray-400',
    overlayChallenge: 'text-gray-200',
    overlayScore: 'text-gray-300',
    overlayScoreDim: 'text-gray-600',
    overlayBestBorder: 'border-gray-600',
    overlayEndtotaalText: '#D1D5DB',
    closeBtn: 'bg-gray-800 hover:bg-gray-700 text-gray-300',
  },
  light: {
    page: 'bg-gray-50 text-gray-900',
    loadingPage: 'bg-gray-50 text-gray-500',
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-700',
    textMuted: 'text-gray-500',
    headingSub: 'text-gray-900',
    infoPanel: 'bg-white border border-gray-200',
    infoText: 'text-gray-700',
    infoMuted: 'text-gray-500',
    activePanel: 'bg-white border border-amber-400 shadow-sm',
    activeLabel: 'text-gray-700',
    statLabel: 'text-gray-600',
    rankRow: 'bg-white border border-gray-200 shadow-sm',
    rankBadgeBg: '#E5E7EB',
    rankBadgeText: '#111827',
    rankSubtext: 'text-gray-600',
    rankEndTime: '#111827',
    tableHeadBorder: 'border-b border-gray-300',
    tableHead: 'text-gray-600',
    tableRowBorder: 'border-b border-gray-200',
    iconInvert: 'opacity-80',
    toggleOn: 'bg-amber-500 text-white',
    toggleOff: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
    themeBtn: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
    emptyText: 'text-gray-500',
    overlayBg: 'bg-white/95',
    overlayStickyBg: 'bg-white',
    overlayHeadBorder: 'border-b border-gray-300',
    overlayRowBorder: 'border-b border-gray-200',
    overlayHeadText: 'text-gray-600',
    overlayChallenge: 'text-gray-800',
    overlayScore: 'text-gray-700',
    overlayScoreDim: 'text-gray-400',
    overlayBestBorder: 'border-gray-300',
    overlayEndtotaalText: '#111827',
    closeBtn: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
  },
};

const formatTime = (s: number) => {
  const clamped = Math.max(0, s);
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const sec = Math.floor(clamped % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
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
  const [showAllScores, setShowAllScores] = useState(false);
  const [theme, setTheme] = useState<Theme>('dark');

  const t = THEMES[theme];

  // Load theme from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('clash-theme');
      if (saved === 'light' || saved === 'dark') setTheme(saved);
    } catch { /* ignore */ }
  }, []);

  // Persist theme changes
  useEffect(() => {
    try {
      localStorage.setItem('clash-theme', theme);
    } catch { /* ignore */ }
  }, [theme]);

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
        const { bonus: rawBonus, straf } = calculateStats(scoreRows, company);

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

        // Apply 80% bonus cap using current timer value
        const timerSec = stoppedElapsed ?? (startTime ? Math.floor((Date.now() - startTime) / 1000) : 0);
        const bonus = capBonus(rawBonus, timerSec, straf);
        const totaal = straf - bonus;

        // Per-event scores for this company
        const scores: Record<string, { best: number; participants: number }> = {};
        for (const event of EVENTS) {
          const eventRows = scoreRows.filter(r => r[0] === company && r[2] === event.name);
          if (eventRows.length > 0) {
            const values = eventRows.map(r => Number(r[3])).filter(v => !isNaN(v));
            const names = new Set(eventRows.map(r => r[1]).filter(Boolean));
            if (values.length > 0) {
              const lowerWins = event.type === 'time' || event.lowerIsBetter;
              const best = lowerWins
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
          const lowerWins = event.type === 'time' || event.lowerIsBetter;
          const isBetter = best === null ||
            (lowerWins ? s.best < best : s.best > best);
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
    const interval = setInterval(() => setTick(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [companies]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${t.loadingPage}`}>
        <p className="text-lg">Dashboard laden...</p>
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
    <div className={`fixed inset-0 p-6 lg:px-10 lg:py-6 flex flex-col overflow-auto ${t.page}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <img src="/logo.svg" alt="Logo" className="h-12 lg:h-14 w-auto" />
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Live scorebord</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${t.themeBtn}`}
            title={theme === 'dark' ? 'Schakel naar lichte modus' : 'Schakel naar donkere modus'}
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
          <button
            onClick={() => setShowAllScores(!showAllScores)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showAllScores ? t.toggleOn : t.toggleOff
            }`}
          >
            Alle scores
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className={`text-sm ${t.textSecondary}`}>
              {lastUpdate ? `Bijgewerkt ${lastUpdate.toLocaleTimeString('nl-BE')}` : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Klassement */}
        <div className="xl:col-span-1 flex flex-col">
          <h2 className={`text-base font-semibold uppercase tracking-wide mb-3 ${t.headingSub}`}>Klassement</h2>

          <div className={`rounded-xl px-4 py-3 mb-3 text-xs leading-relaxed space-y-1.5 ${t.infoPanel} ${t.infoText}`}>
            <div>
              <span className="text-amber-500 font-semibold">Eindtijd</span> = ⏱️ stopwatch <span className="text-red-500">+ straftijd</span> <span className="text-emerald-600">− bonustijd</span>
            </div>
            <div>
              <span className="text-red-500 font-medium">Straftijd</span> <span className={t.infoMuted}>(telt op):</span> Fietsen, Blazepods, Piccoo
            </div>
            <div>
              <span className="text-emerald-600 font-medium">Bonustijd</span> <span className={t.infoMuted}>(trekt af):</span> Roeien, Axethrowing, VR, Icaros, Firewall, PacMan, Streetracket, Copycat
            </div>
            <div className={`italic pt-0.5 ${t.infoMuted}`}>
              Bonustijd verlaagt de eindtijd met maximaal 80%.
            </div>
          </div>

          {/* Timer & Stats voor het actieve bedrijf */}
          {active && (isRunning(active) || getTimerSeconds(active) > 0) && (
            <div className={`rounded-xl p-4 mb-3 flex items-center gap-5 ${t.activePanel}`}>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  {isRunning(active) && <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                  <span className={`text-xs font-medium ${t.activeLabel}`}>{active.company}</span>
                </div>
                <div className={`text-3xl font-bold tabular-nums ${
                  isRunning(active) ? 'text-amber-500' : 'text-emerald-600'
                }`}>
                  {formatTime(getTimerSeconds(active))}
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <div className={`text-xs ${t.statLabel}`}>Bonus</div>
                  <div className="text-emerald-600 font-bold">{active.bonus}s</div>
                </div>
                <div className="text-center">
                  <div className={`text-xs ${t.statLabel}`}>Straf</div>
                  <div className="text-red-500 font-bold">{active.straf}s</div>
                </div>
                <div className="text-center">
                  <div className={`text-xs ${t.statLabel}`}>Totaal</div>
                  <div className="text-indigo-500 font-bold">{formatTime(getTimerSeconds(active) + active.totaal)}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col gap-2">
            {companies.map((c, i) => {
              const rank = i + 1;
              const medalColor = rank <= 3 ? MEDAL_COLORS[rank - 1] : undefined;
              return (
                <div
                  key={c.company}
                  className={`rounded-xl px-4 py-3 flex items-center gap-4 ${t.rankRow}`}
                  style={medalColor ? { borderLeft: `4px solid ${medalColor}` } : { borderLeft: '4px solid transparent' }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-base shrink-0"
                    style={{ backgroundColor: medalColor || t.rankBadgeBg, color: medalColor ? '#111' : t.rankBadgeText }}
                  >
                    {rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-base truncate">{c.company}</div>
                    <div className={`text-xs ${t.rankSubtext}`}>
                      Bonus {c.bonus}s &middot; Straf {c.straf}s
                      {isRunning(c) && <span className="text-amber-500 ml-2">&#9679; Timer loopt</span>}
                      {!isRunning(c) && getTimerSeconds(c) > 0 && <span className="text-emerald-600 ml-2">&#10003; Klaar</span>}
                    </div>
                  </div>
                  <div className="font-mono text-xl font-bold tabular-nums shrink-0" style={{ color: medalColor || t.rankEndTime }}>
                    {formatTime(getTimerSeconds(c) + c.totaal)}
                  </div>
                </div>
              );
            })}
            {companies.length === 0 && (
              <p className={`text-center py-4 ${t.emptyText}`}>Nog geen teams gestart</p>
            )}
          </div>
        </div>

        {/* Scores per challenge */}
        <div className="xl:col-span-2 flex flex-col">
          <h2 className={`text-base font-semibold uppercase tracking-wide mb-3 ${t.headingSub}`}>Scores per challenge</h2>
          <table className="w-full text-base flex-1">
            <thead>
              <tr className={t.tableHeadBorder}>
                <th className={`text-left py-2 px-3 font-medium ${t.tableHead}`}>Challenge</th>
                {active && (
                  <th className={`text-center py-2 px-3 font-semibold ${t.tableHead}`}>{active.company}</th>
                )}
                <th className="text-center py-2 px-3 text-amber-500 font-semibold">High score</th>
              </tr>
            </thead>
            <tbody>
              {EVENTS.map((event) => {
                const hs = highScores[event.name];
                const myScore = active?.scores[event.name];
                const isBest = myScore && hs && myScore.best === hs.score;

                return (
                  <tr key={event.name} className={t.tableRowBorder}>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <img src={event.icon} alt="" className={`w-5 h-5 ${t.iconInvert}`} />
                        <span className="font-medium">{event.name}</span>
                      </div>
                    </td>
                    {active && (
                      <td className="text-center py-2 px-3">
                        {myScore ? (
                          <span className={`font-mono font-semibold ${isBest ? 'text-emerald-600' : t.textSecondary}`}>
                            {myScore.best}{event.type === 'time' ? 's' : ''}
                          </span>
                        ) : (
                          <span className={t.textMuted}>—</span>
                        )}
                      </td>
                    )}
                    <td className="text-center py-2 px-3">
                      {hs ? (
                        <div>
                          <span className="font-mono font-bold text-amber-500">
                            {hs.score}{event.type === 'time' ? 's' : ''}
                          </span>
                          <span className={`text-xs ml-2 ${t.textSecondary}`}>
                            {hs.company}
                          </span>
                        </div>
                      ) : (
                        <span className={t.textMuted}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alle scores overlay */}
      {showAllScores && (
        <div className={`fixed inset-0 z-50 flex flex-col overflow-auto ${t.overlayBg} ${t.textPrimary}`}>
          <div className="p-6 lg:px-10 lg:py-6 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Alle scores per bedrijf</h2>
              <button
                onClick={() => setShowAllScores(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${t.closeBtn}`}
              >
                Sluiten
              </button>
            </div>
            <div className="overflow-auto flex-1">
              <table className="w-full text-base border-collapse h-full">
                <thead className={`sticky top-0 ${t.overlayStickyBg}`}>
                  <tr className={t.overlayHeadBorder}>
                    <th className={`text-left py-3 px-3 font-medium sticky left-0 z-10 ${t.overlayHeadText} ${t.overlayStickyBg}`}>Challenge</th>
                    {companies.map(c => (
                      <th key={c.company} className={`text-center py-3 px-3 font-semibold whitespace-nowrap ${t.textPrimary}`}>
                        {c.company}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {EVENTS.map(event => {
                    const hs = highScores[event.name];
                    return (
                      <tr key={event.name} className={t.overlayRowBorder}>
                        <td className={`py-2 px-3 sticky left-0 z-10 ${t.overlayStickyBg}`}>
                          <div className="flex items-center gap-2">
                            <img src={event.icon} alt="" className={`w-4 h-4 ${t.iconInvert}`} />
                            <span className={`font-medium ${t.overlayChallenge}`}>{event.name}</span>
                          </div>
                        </td>
                        {companies.map(c => {
                          const score = c.scores[event.name];
                          const isBest = score && hs && score.best === hs.score;
                          return (
                            <td key={c.company} className="text-center py-2 px-3">
                              {score ? (
                                <span className={`font-mono font-semibold ${isBest ? 'text-amber-500' : t.overlayScore}`}>
                                  {score.best}{event.type === 'time' ? 's' : ''}
                                </span>
                              ) : (
                                <span className={t.overlayScoreDim}>—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  {/* Samenvattingsrijen */}
                  <tr className={`border-t-2 ${t.overlayBestBorder}`}>
                    <td className={`py-2 px-3 sticky left-0 z-10 font-semibold text-emerald-600 ${t.overlayStickyBg}`}>Bonus</td>
                    {companies.map(c => (
                      <td key={c.company} className="text-center py-2 px-3 font-mono font-semibold text-emerald-600">
                        {c.bonus}s
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className={`py-2 px-3 sticky left-0 z-10 font-semibold text-red-500 ${t.overlayStickyBg}`}>Straf</td>
                    {companies.map(c => (
                      <td key={c.company} className="text-center py-2 px-3 font-mono font-semibold text-red-500">
                        {c.straf}s
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className={`py-2 px-3 sticky left-0 z-10 font-semibold ${t.textPrimary} ${t.overlayStickyBg}`}>Timer</td>
                    {companies.map(c => (
                      <td key={c.company} className={`text-center py-2 px-3 font-mono font-semibold ${t.textPrimary}`}>
                        {formatTime(getTimerSeconds(c))}
                      </td>
                    ))}
                  </tr>
                  <tr className={`border-t ${t.overlayBestBorder}`}>
                    <td className={`py-3 px-3 sticky left-0 z-10 font-bold text-base ${t.textPrimary} ${t.overlayStickyBg}`}>Eindtotaal</td>
                    {companies.map((c, i) => {
                      const rank = i + 1;
                      const medalColor = rank <= 3 ? MEDAL_COLORS[rank - 1] : undefined;
                      return (
                        <td key={c.company} className="text-center py-3 px-3 font-mono font-bold text-base" style={{ color: medalColor || t.overlayEndtotaalText }}>
                          {formatTime(getTimerSeconds(c) + c.totaal)}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
