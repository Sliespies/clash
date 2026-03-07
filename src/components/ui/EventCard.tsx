'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import type { GameEvent } from '@/lib/events';
import { useScoreEntry } from '@/hooks/useScoreEntry';
import Button from './Button';
import Input from './Input';
import ErrorMessage from './ErrorMessage';

interface EventCardProps {
  event: GameEvent;
  completed?: boolean;
  expanded?: boolean;
  company: string;
  userName: string;
  onClick: () => void;
  onSaved: () => void;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export default function EventCard({
  event,
  completed,
  expanded,
  company,
  userName,
  onClick,
  onSaved,
  onClose,
  showToast,
}: EventCardProps) {
  const expandRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { value, setValue, saving, error, existingInfo, loading, handleSave } =
    useScoreEntry({ event, company, userName });

  useEffect(() => {
    if (expanded && expandRef.current) {
      gsap.fromTo(
        expandRef.current,
        { height: 0, opacity: 0 },
        { height: 'auto', opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [expanded]);

  const onSave = async () => {
    const success = await handleSave();
    if (success) {
      showToast('Score opgeslagen!');
      onSaved();
      onClose();
    }
  };

  if (expanded) {
    return (
      <div className="bg-white border-l-4 border-indigo-500 rounded-xl py-4 px-4 text-left">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{event.icon}</span>
          <div>
            <div className="font-medium text-sm text-gray-800">{event.name}</div>
            <div className="text-[0.7rem] text-gray-400">{event.desc}</div>
          </div>
        </div>

        <div ref={expandRef} className="overflow-hidden">
          {existingInfo && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-lg px-3 py-2 mb-3">
              {existingInfo}
            </div>
          )}

          <div className="text-xs text-gray-500 mb-1">{event.label}</div>
          <Input
            ref={inputRef}
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSave();
              if (e.key === 'Escape') onClose();
            }}
            placeholder="0"
            min="0"
            inputMode="numeric"
            disabled={loading}
            className="!text-lg !h-12 text-center font-medium mb-3"
          />

          <ErrorMessage message={error} />

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={onClose}
              className="!w-auto flex-1"
            >
              Annuleer
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
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white border-l-4 rounded-xl shadow-sm py-4 px-4 text-left cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97] ${
        completed ? 'border-emerald-400 opacity-60' : 'border-indigo-500'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">{event.icon}</span>
        {completed && <span className="text-emerald-500 text-sm">&#10003;</span>}
      </div>
      <div className="font-medium text-sm text-gray-800 mt-2">{event.name}</div>
      <div className="text-[0.7rem] text-gray-400 mt-0.5">{event.label}</div>
    </div>
  );
}
