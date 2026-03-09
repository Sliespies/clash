'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import gsap from 'gsap';
import { EVENTS, type GameEvent } from '@/lib/events';
import { calculateStats, getHighScores, type Stats, type HighScore } from '@/lib/scoring';
import { useScoreEntry } from '@/hooks/useScoreEntry';
import { useTimer } from '@/hooks/useTimer';
import { Button, Input, ErrorMessage, StatBox } from '@/components/ui';

interface EventsScreenProps {
  company: string;
  userName: string;
  onDone: () => void;
  onBack: () => void;
  showToast: (msg: string) => void;
}

function ScoreInput({
  event,
  company,
  userName,
  showToast,
  onSaved,
  onBack,
  completed,
  highScore,
  onTimerStart,
}: {
  event: GameEvent;
  company: string;
  userName: string;
  showToast: (msg: string) => void;
  onSaved: () => void;
  onBack: () => void;
  completed: boolean;
  highScore?: HighScore;
  onTimerStart?: () => Promise<void>;
}) {
  const { value, setValue, saving, error, existingInfo, loading, handleSave } =
    useScoreEntry({ event, company, userName });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  const onSave = async () => {
    const success = await handleSave();
    if (success) {
      if (onTimerStart) await onTimerStart();
      showToast('Score opgeslagen!');
      onSaved();
    }
  };

  return (
    <div className="flex flex-col items-center text-center">
      <div className="text-5xl mb-3">{event.icon}</div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">{event.name}</h2>
      <p className="text-sm text-gray-400 mb-5">{event.desc}</p>

      {existingInfo && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-xl px-4 py-2 mb-3 w-full">
          {existingInfo}
        </div>
      )}

      {highScore && (
        <div className="bg-indigo-50 text-indigo-600 text-xs rounded-xl px-4 py-2 mb-3 w-full">
          Highscore: {highScore.score}{event.type === 'time' ? 's' : ''} — {highScore.name} ({highScore.company})
        </div>
      )}

      <div className="w-full mb-1">
        <div className="text-xs text-gray-400 mb-2">{event.label}</div>
        <Input
          ref={inputRef}
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave();
            if (e.key === 'Escape') onBack();
          }}
          placeholder="0"
          min="0"
          inputMode="numeric"
          disabled={loading}
          className="!text-2xl !h-14 text-center font-medium"
        />
      </div>

      {loading && (
        <p className="text-gray-400 text-sm mt-1">Score ophalen...</p>
      )}

      <ErrorMessage message={error} />

      <div className="flex gap-2 w-full mt-4">
        <Button variant="secondary" onClick={onBack} className="!w-auto flex-1">
          Terug
        </Button>
        <Button
          variant="success"
          disabled={saving || loading}
          onClick={onSave}
          className="!w-auto flex-[2]"
        >
          {saving ? 'Opslaan...' : 'Opslaan'}
        </Button>
      </div>
    </div>
  );
}

function TimerStopInput({
  showToast,
  onSaved,
  onBack,
  timerStatus,
  onStop,
}: {
  showToast: (msg: string) => void;
  onSaved: () => void;
  onBack: () => void;
  timerStatus: 'not-started' | 'running' | 'stopped';
  onStop: () => Promise<number | null>;
}) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  const onSave = async () => {
    const normalized = value.trim().toLowerCase().replace(/\s+/g, '');
    if (normalized !== 'samensterk') {
      setError('Fout wachtwoord!');
      return;
    }
    if (timerStatus === 'stopped') {
      setError('Timer is al gestopt!');
      return;
    }
    if (timerStatus === 'not-started') {
      setError('Timer is nog niet gestart.');
      return;
    }

    setError('');
    setSaving(true);
    try {
      const elapsed = await onStop();
      if (elapsed !== null) {
        const h = Math.floor(elapsed / 3600);
        const m = Math.floor((elapsed % 3600) / 60);
        const s = elapsed % 60;
        showToast(`Timer gestopt! ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      }
      onSaved();
    } catch {
      setError('Timer stoppen mislukt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center text-center">
      <div className="text-5xl mb-3">⏱️</div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Timer Stoppen</h2>
      <p className="text-sm text-gray-400 mb-5">Voer het wachtwoord in om de timer te stoppen</p>

      {timerStatus === 'stopped' && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl px-4 py-2 mb-3 w-full">
          Timer is al gestopt!
        </div>
      )}
      {timerStatus === 'not-started' && (
        <div className="bg-gray-50 text-gray-500 text-xs rounded-xl px-4 py-2 mb-3 w-full">
          Timer is nog niet gestart (start bij eerste score).
        </div>
      )}

      <div className="w-full mb-1">
        <div className="text-xs text-gray-400 mb-2">Wachtwoord</div>
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave();
            if (e.key === 'Escape') onBack();
          }}
          placeholder="Wachtwoord..."
          className="!text-2xl !h-14 text-center font-medium"
        />
      </div>

      <ErrorMessage message={error} />

      <div className="flex gap-2 w-full mt-4">
        <Button variant="secondary" onClick={onBack} className="!w-auto flex-1">
          Terug
        </Button>
        <Button
          variant="success"
          disabled={saving}
          onClick={onSave}
          className="!w-auto flex-[2]"
        >
          {saving ? 'Stoppen...' : 'Stop Timer'}
        </Button>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const h = Math.floor(Math.abs(seconds) / 3600);
  const m = Math.floor((Math.abs(seconds) % 3600) / 60);
  const s = Math.floor(Math.abs(seconds) % 60);
  const sign = seconds < 0 ? '-' : '';
  return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function EventsScreen({
  company,
  userName,
  onDone,
  onBack,
  showToast,
}: EventsScreenProps) {
  const [selectedEvent, setSelectedEvent] = useState<GameEvent | null>(null);
  const [showTimerStop, setShowTimerStop] = useState(false);
  const [stats, setStats] = useState<(Stats & { timer: number; finalTotaal: number }) | null>(null);
  const [completedEvents, setCompletedEvents] = useState<Set<string>>(new Set());
  const [highScores, setHighScores] = useState<Record<string, HighScore>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const prevStats = useRef<{ bonus: number; straf: number; totaal: number; finalTotaal: number }>({ bonus: 0, straf: 0, totaal: 0, finalTotaal: 0 });
  const timer = useTimer(company);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get', range: 'Scores!A:E' }),
      });
      const data = await res.json();
      if (!res.ok) return;
      const rows: string[][] = data.values || [];
      const baseStats = calculateStats(rows, company);

      // Fetch timer seconds
      let timerSeconds = 0;
      try {
        const timerRes = await fetch('/api/sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get', range: 'Timer!A:D' }),
        });
        const timerData = await timerRes.json();
        if (timerRes.ok) {
          const timerRows: string[][] = timerData.values || [];
          for (const tr of timerRows) {
            if (tr[0] === company && tr[1]) {
              if (tr[2]) {
                timerSeconds = Number(tr[3]) || 0;
              } else {
                timerSeconds = Math.floor((Date.now() - new Date(tr[1]).getTime()) / 1000);
              }
              break;
            }
          }
        }
      } catch {
        // Timer tab might not exist
      }

      const newStats = {
        bonus: baseStats.bonus,
        straf: baseStats.straf,
        timer: timerSeconds,
        totaal: baseStats.straf - baseStats.bonus,
        finalTotaal: timerSeconds + baseStats.straf - baseStats.bonus,
      };
      setStats(newStats);
      setHighScores(getHighScores(rows, EVENTS));

      const done = new Set<string>();
      for (const row of rows) {
        if (row[0] === company && row[2]) {
          const ev = EVENTS.find(e => e.name === row[2]);
          if ((ev && ev.shared) || row[1] === userName) {
            done.add(row[2]);
          }
        }
      }
      setCompletedEvents(done);

      if (statsRef.current) {
        const from = prevStats.current;
        const obj = { bonus: from.bonus, straf: from.straf, totaal: from.totaal, finalTotaal: from.finalTotaal };
        gsap.to(obj, {
          bonus: newStats.bonus,
          straf: newStats.straf,
          totaal: newStats.totaal,
          finalTotaal: newStats.finalTotaal,
          duration: 0.8,
          ease: 'power2.out',
          snap: { bonus: 1, straf: 1, totaal: 1, finalTotaal: 1 },
          onUpdate: () => {
            const bonusEl = document.getElementById('stat-bonus');
            const strafEl = document.getElementById('stat-straf');
            const totaalEl = document.getElementById('stat-totaal');
            const finalEl = document.getElementById('stat-final-totaal');
            if (bonusEl) bonusEl.textContent = Math.round(obj.bonus) + 's';
            if (strafEl) strafEl.textContent = Math.round(obj.straf) + 's';
            if (totaalEl) totaalEl.textContent = formatTime(Math.round(obj.totaal));
            if (finalEl) finalEl.textContent = formatTime(Math.round(obj.finalTotaal));
          },
        });
        prevStats.current = newStats;
      }
    } catch {
      // silently fail
    }
  }, [company]);

  useEffect(() => {
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
    );
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (!selectedEvent && listRef.current) {
      gsap.fromTo(
        listRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.35, ease: 'power1.out' }
      );
    }
  }, [selectedEvent]);

  const selectEvent = (event: GameEvent | 'timer') => {
    if (!listRef.current) {
      if (event === 'timer') { setShowTimerStop(true); setSelectedEvent(null); }
      else { setSelectedEvent(event); setShowTimerStop(false); }
      return;
    }
    gsap.to(listRef.current, {
      opacity: 0,
      duration: 0.2,
      ease: 'power1.in',
      onComplete: () => {
        if (event === 'timer') { setShowTimerStop(true); setSelectedEvent(null); }
        else { setSelectedEvent(event); setShowTimerStop(false); }
        if (slideRef.current) {
          gsap.fromTo(
            slideRef.current,
            { opacity: 0 },
            { opacity: 1, duration: 0.35, ease: 'power1.out' }
          );
        }
      },
    });
  };

  const backToList = () => {
    if (!slideRef.current) {
      setSelectedEvent(null);
      setShowTimerStop(false);
      return;
    }
    gsap.to(slideRef.current, {
      opacity: 0,
      duration: 0.2,
      ease: 'power1.in',
      onComplete: () => { setSelectedEvent(null); setShowTimerStop(false); },
    });
  };

  const handleSaved = () => {
    loadStats();
    timer.loadTimer();
    backToList();
  };

  return (
    <div ref={containerRef}>
      <div className="flex justify-center mb-4">
        <div className="text-gray-500 text-[0.8rem] py-1.5 px-4 bg-gray-100 rounded-full">
          {userName} &middot; {company}
        </div>
      </div>

      {!selectedEvent && !showTimerStop ? (
        <>
          {/* Timer display */}
          <div className={`rounded-2xl p-4 text-center mb-4 ${
            timer.status === 'stopped' ? 'bg-emerald-50' :
            timer.status === 'running' ? 'bg-amber-50' : 'bg-gray-50'
          }`}>
            <div className={`text-[0.7rem] uppercase tracking-wide mb-1 ${
              timer.status === 'stopped' ? 'text-emerald-400' :
              timer.status === 'running' ? 'text-amber-400' : 'text-gray-400'
            }`}>Timer</div>
            <div className={`text-2xl font-semibold tabular-nums ${
              timer.status === 'stopped' ? 'text-emerald-600' :
              timer.status === 'running' ? 'text-amber-600' : 'text-gray-300'
            }`}>{timer.display}</div>
          </div>

          {stats && timer.status === 'stopped' ? (
            <div ref={statsRef} className="bg-indigo-50 rounded-2xl p-5 text-center mb-4">
              <div className="text-[0.7rem] text-indigo-400 uppercase tracking-wide mb-1">Eindtotaal</div>
              <div id="stat-final-totaal" className="text-3xl font-bold text-indigo-600 tabular-nums">{formatTime(stats.finalTotaal)}</div>
              <div className="text-xs text-indigo-300 mt-1">Timer {stats.timer}s + Straf {stats.straf}s − Bonus {stats.bonus}s</div>
            </div>
          ) : stats ? (
            <StatBox
              ref={statsRef}
              items={[
                { label: 'Bonus', value: `${stats.bonus}s`, id: 'stat-bonus', color: 'green' },
                { label: 'Straf', value: `${stats.straf}s`, id: 'stat-straf', color: 'red' },
                { label: 'Totaal', value: formatTime(stats.totaal), id: 'stat-totaal', color: 'indigo' },
              ]}
            />
          ) : null}

          <p className="text-center text-gray-400 text-sm mb-3">Kies een activiteit</p>

          <div ref={listRef} className="flex flex-wrap gap-2">
            {EVENTS.map((event) => {
              const done = completedEvents.has(event.name);
              return (
                <button
                  key={event.name}
                  onClick={() => selectEvent(event)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full text-left transition-all cursor-pointer border-none ${
                    done
                      ? 'bg-emerald-50 hover:bg-emerald-100'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-base">{event.icon}</span>
                  <span className="text-sm font-medium text-gray-800">{event.name}</span>
                  {done && <span className="text-emerald-500 text-xs ml-0.5">✓</span>}
                </button>
              );
            })}
            <button
              onClick={() => selectEvent('timer')}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-full text-left transition-all cursor-pointer border-none bg-amber-50 hover:bg-amber-100"
            >
              <span className="text-base">⏱️</span>
              <span className="text-sm font-medium text-amber-700">Timer Stoppen</span>
            </button>
          </div>

          <Button variant="secondary" onClick={onDone} className="mt-6">
            Klaar
          </Button>

          <button
            onClick={onBack}
            className="w-full text-center text-gray-400 text-[0.85rem] mt-3 cursor-pointer bg-transparent border-none hover:text-gray-600 transition-colors"
          >
            &larr; Terug
          </button>
        </>
      ) : showTimerStop ? (
        <div ref={slideRef}>
          <TimerStopInput
            showToast={showToast}
            onSaved={handleSaved}
            onBack={backToList}
            timerStatus={timer.status}
            onStop={timer.stopTimer}
          />
        </div>
      ) : selectedEvent ? (
        <div ref={slideRef}>
          <ScoreInput
            key={selectedEvent.name}
            event={selectedEvent}
            company={company}
            userName={userName}
            showToast={showToast}
            onSaved={handleSaved}
            onBack={backToList}
            completed={completedEvents.has(selectedEvent.name)}
            highScore={highScores[selectedEvent.name]}
            onTimerStart={timer.startTimer}
          />
        </div>
      ) : null}
    </div>
  );
}
