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
            const elapsed = Number(rows[i][3]) || Math.floor((new Date(rows[i][2]).getTime() - startTime) / 1000);
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
  }, [loadTimer]);

  const startTimer = useCallback(async () => {
    if (timerState.startTime) return; // Already started

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
      // Reload to get the row number
      await loadTimer();
    } catch {
      // Silently fail
    }
  }, [company, timerState.startTime, loadTimer]);

  const stopTimer = useCallback(async (): Promise<number | null> => {
    if (!timerState.startTime || timerState.stopped || !timerState.row) return null;

    const elapsedSeconds = Math.floor((Date.now() - timerState.startTime) / 1000);
    const now = new Date().toISOString();

    try {
      await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          range: `Timer!C${timerState.row}:D${timerState.row}`,
          values: [[now, elapsedSeconds]],
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
