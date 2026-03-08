'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import gsap from 'gsap';
import { EVENTS, type GameEvent } from '@/lib/events';
import { calculateStats, getHighScores, type Stats, type HighScore } from '@/lib/scoring';
import { useScoreEntry } from '@/hooks/useScoreEntry';
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
}: {
  event: GameEvent;
  company: string;
  userName: string;
  showToast: (msg: string) => void;
  onSaved: () => void;
  onBack: () => void;
  completed: boolean;
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

export default function EventsScreen({
  company,
  userName,
  onDone,
  onBack,
  showToast,
}: EventsScreenProps) {
  const [selectedEvent, setSelectedEvent] = useState<GameEvent | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [completedEvents, setCompletedEvents] = useState<Set<string>>(new Set());
  const [highScores, setHighScores] = useState<Record<string, HighScore>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const prevStats = useRef<Stats>({ bonus: 0, straf: 0, totaal: 0 });

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
      const newStats = calculateStats(rows, company);
      setStats(newStats);
      setHighScores(getHighScores(rows, EVENTS));

      const done = new Set<string>();
      for (const row of rows) {
        if (row[0] === company && row[2]) {
          // Roeien is shared (per company), others are per person
          if (row[2] === 'Roeien' || row[1] === userName) {
            done.add(row[2]);
          }
        }
      }
      setCompletedEvents(done);

      if (statsRef.current) {
        const from = prevStats.current;
        const obj = { bonus: from.bonus, straf: from.straf, totaal: from.totaal };
        gsap.to(obj, {
          bonus: newStats.bonus,
          straf: newStats.straf,
          totaal: newStats.totaal,
          duration: 0.8,
          ease: 'power2.out',
          snap: { bonus: 1, straf: 1, totaal: 1 },
          onUpdate: () => {
            const bonusEl = document.getElementById('stat-bonus');
            const strafEl = document.getElementById('stat-straf');
            const totaalEl = document.getElementById('stat-totaal');
            if (bonusEl) bonusEl.textContent = Math.round(obj.bonus) + 's';
            if (strafEl) strafEl.textContent = Math.round(obj.straf) + 's';
            if (totaalEl) totaalEl.textContent = Math.round(obj.totaal) + 's';
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

  const selectEvent = (event: GameEvent) => {
    if (!listRef.current) {
      setSelectedEvent(event);
      return;
    }
    gsap.to(listRef.current, {
      opacity: 0,
      duration: 0.2,
      ease: 'power1.in',
      onComplete: () => {
        setSelectedEvent(event);
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
      return;
    }
    gsap.to(slideRef.current, {
      opacity: 0,
      duration: 0.2,
      ease: 'power1.in',
      onComplete: () => setSelectedEvent(null),
    });
  };

  const handleSaved = () => {
    loadStats();
    backToList();
  };

  return (
    <div ref={containerRef}>
      <div className="flex justify-center mb-4">
        <div className="text-gray-500 text-[0.8rem] py-1.5 px-4 bg-gray-100 rounded-full">
          {userName} &middot; {company}
        </div>
      </div>

      {!selectedEvent ? (
        <>
          {stats && (
            <StatBox
              ref={statsRef}
              items={[
                { label: 'Bonus', value: `${stats.bonus}s`, id: 'stat-bonus', color: 'green' },
                { label: 'Straf', value: `${stats.straf}s`, id: 'stat-straf', color: 'red' },
                { label: 'Totaal', value: `${stats.totaal}s`, id: 'stat-totaal', color: 'indigo' },
              ]}
            />
          )}

          <p className="text-center text-gray-400 text-sm mb-3">Kies een activiteit</p>

          <div ref={listRef} className="flex flex-wrap gap-2">
            {EVENTS.map((event) => {
              const done = completedEvents.has(event.name);
              const hs = highScores[event.name];
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
                  {hs && (
                    <span className="text-[0.65rem] text-gray-400">
                      {hs.score}{event.type === 'time' ? 's' : ''} · {hs.name}
                    </span>
                  )}
                  {done && <span className="text-emerald-500 text-xs ml-0.5">✓</span>}
                </button>
              );
            })}
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
      ) : (
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
          />
        </div>
      )}
    </div>
  );
}
