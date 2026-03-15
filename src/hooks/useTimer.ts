'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface TimerState {
  startTime: number | null;
  stopped: boolean;
  elapsed: number | null;
  row: number | null;
}

export function useTimer(company: string) {
  const [timerState, setTimerState] = useState<TimerState>({
    startTime: null,
    stopped: false,
    elapsed: null,
    row: null,
  });
  const [display, setDisplay] = useState('00:00:00');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const loadTimer = useCallback(async () => {
    try {
      const res = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get', range: 'Timer!A:D' }),
      });
      const data = await res.json();
      if (!res.ok) return;
      const rows: string[][] = data.values || [];
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][0] === company) {
          const startTime = new Date(rows[i][1]).getTime();
          if (rows[i][2]) {
            // Calculate elapsed from start/stop times (column D now stores eindtotaal)
            const elapsed = Math.floor((new Date(rows[i][2]).getTime() - startTime) / 1000);
            setTimerState({ startTime, stopped: true, elapsed, row: i + 1 });
          } else {
            setTimerState({ startTime, stopped: false, elapsed: null, row: i + 1 });
          }
          return;
        }
      }
      setTimerState({ startTime: null, stopped: false, elapsed: null, row: null });
    } catch {
      // Timer tab might not exist
    }
  }, [company]);

  // Start ticking
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (timerState.stopped && timerState.elapsed !== null) {
      setDisplay(formatTime(timerState.elapsed));
      return;
    }

    if (!timerState.startTime) {
      setDisplay('00:00:00');
      return;
    }

    const tick = () => {
      const elapsed = Math.floor((Date.now() - timerState.startTime!) / 1000);
      setDisplay(formatTime(elapsed));
    };
    tick();
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerState]);

  useEffect(() => {
    loadTimer();
    const poll = setInterval(() => {
      if (!document.hidden) loadTimer();
    }, 10000);
    return () => clearInterval(poll);
  }, [loadTimer]);

  const startTimer = useCallback(async () => {
    if (timerState.startTime || timerState.stopped) return; // Already started or already stopped

    // Double-check: fetch timer from sheet to prevent duplicate/overwrite
    try {
      const checkRes = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get', range: 'Timer!A:D' }),
      });
      const checkData = await checkRes.json();
      if (checkRes.ok) {
        const rows: string[][] = checkData.values || [];
        const existing = rows.find(r => r[0] === company);
        if (existing && existing[1]) {
          // Timer already exists in sheet, don't create a new one
          await loadTimer();
          return;
        }
      }
    } catch { /* continue */ }

    const now = new Date();
    try {
      await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'append',
          range: 'Timer!A:D',
          values: [[company, now.toISOString(), '', '']],
        }),
      });
      await loadTimer();
    } catch {
      // Silently fail
    }
  }, [company, timerState.startTime, timerState.stopped, loadTimer]);

  const stopTimer = useCallback(async (totaal?: number): Promise<number | null> => {
    if (!timerState.startTime || timerState.stopped || !timerState.row) return null;

    const elapsedSeconds = Math.floor((Date.now() - timerState.startTime) / 1000);
    const now = new Date().toISOString();
    // Column D = eindtotaal (elapsed + straf - bonus) in HH:MM:SS format
    const eindtotaalSec = totaal !== undefined ? elapsedSeconds + totaal : elapsedSeconds;
    const abs = Math.abs(eindtotaalSec);
    const sign = eindtotaalSec < 0 ? '-' : '';
    const hh = String(Math.floor(abs / 3600)).padStart(2, '0');
    const mm = String(Math.floor((abs % 3600) / 60)).padStart(2, '0');
    const ss = String(Math.floor(abs % 60)).padStart(2, '0');
    const eindtotaalFormatted = `${sign}${hh}:${mm}:${ss}`;

    try {
      await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          range: `Timer!C${timerState.row}:D${timerState.row}`,
          values: [[now, eindtotaalFormatted]],
        }),
      });
      setTimerState(prev => ({ ...prev, stopped: true, elapsed: elapsedSeconds }));
      return elapsedSeconds;
    } catch {
      throw new Error('Timer stoppen mislukt');
    }
  }, [timerState]);

  const status: 'not-started' | 'running' | 'stopped' =
    timerState.stopped ? 'stopped' :
    timerState.startTime ? 'running' : 'not-started';

  return {
    display,
    status,
    startTimer,
    stopTimer,
    loadTimer,
    elapsedSeconds: timerState.elapsed,
    startTime: timerState.startTime,
  };
}
