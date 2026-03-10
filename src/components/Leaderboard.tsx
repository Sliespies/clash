'use client';

import { useState, useEffect, useCallback } from 'react';
import { calculateStats } from '@/lib/scoring';

interface RankedCompany {
  company: string;
  finalScore: number;
}

const formatTime = (s: number) => {
  const h = Math.floor(Math.abs(s) / 3600);
  const m = Math.floor((Math.abs(s) % 3600) / 60);
  const sec = Math.floor(Math.abs(s) % 60);
  const sign = s < 0 ? '-' : '';
  return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

export default function Leaderboard() {
  const [rankings, setRankings] = useState<RankedCompany[]>([]);
  const [loading, setLoading] = useState(true);

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
          body: JSON.stringify({ action: 'get', range: 'Timer!A:D' }),
        }),
      ]);

      const scoresData = await scoresRes.json();
      const timerData = await timerRes.json();

      if (!scoresRes.ok) throw new Error(scoresData.error);
      if (!timerRes.ok) throw new Error(timerData.error);

      const scoreRows: string[][] = scoresData.values || [];
      const timerRows: string[][] = timerData.values || [];

      const companies = [...new Set(timerRows.map((r) => r[0]).filter(Boolean))];

      const ranked: RankedCompany[] = companies.map((company) => {
        const { totaal } = calculateStats(scoreRows, company);

        const timerRow = timerRows.find((r) => r[0] === company);
        let timerSeconds = 0;
        if (timerRow) {
          if (timerRow[2]) {
            timerSeconds = Number(timerRow[3]);
          } else {
            timerSeconds = Math.floor(
              (Date.now() - new Date(timerRow[1]).getTime()) / 1000
            );
          }
        }

        return { company, finalScore: timerSeconds + totaal };
      });

      ranked.sort((a, b) => a.finalScore - b.finalScore);
      setRankings(ranked);
    } catch (e) {
      console.error('Leaderboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        Klassement laden...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rankings.map((entry, index) => {
        const rank = index + 1;
        const medalColor = rank <= 3 ? MEDAL_COLORS[rank - 1] : undefined;

        return (
          <div
            key={entry.company}
            className="bg-white rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-gray-800"
            style={
              medalColor
                ? { borderLeft: `4px solid ${medalColor}` }
                : { borderLeft: '4px solid transparent' }
            }
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shrink-0"
              style={{
                backgroundColor: medalColor || '#9CA3AF',
              }}
            >
              {rank}
            </div>
            <div className="flex-1 font-medium truncate">{entry.company}</div>
            <div className="font-mono text-gray-600 shrink-0">
              {formatTime(entry.finalScore)}
            </div>
          </div>
        );
      })}

      {rankings.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          Nog geen data beschikbaar.
        </div>
      )}
    </div>
  );
}
