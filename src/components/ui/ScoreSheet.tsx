'use client';

import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import type { GameEvent } from '@/lib/events';
import { useScoreEntry } from '@/hooks/useScoreEntry';
import { Button, Input, Label, ErrorMessage } from '@/components/ui';

interface ScoreSheetProps {
  event: GameEvent;
  company: string;
  userName: string;
  onSaved: () => void;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export default function ScoreSheet({
  event,
  company,
  userName,
  onSaved,
  onClose,
  showToast,
}: ScoreSheetProps) {
  const { value, setValue, saving, error, sharedInfo, loadingShared, handleSave } =
    useScoreEntry({ event, company, userName });

  const backdropRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    gsap.fromTo(
      backdropRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.25, ease: 'power2.out' }
    );
    gsap.fromTo(
      sheetRef.current,
      { y: '100%' },
      {
        y: '0%',
        duration: 0.35,
        ease: 'power3.out',
        onComplete: () => inputRef.current?.focus(),
      }
    );
  }, []);

  const animateClose = (callback: () => void) => {
    if (isClosing) return;
    setIsClosing(true);
    gsap.to(sheetRef.current, { y: '100%', duration: 0.25, ease: 'power2.in' });
    gsap.to(backdropRef.current, {
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: callback,
    });
  };

  const handleClose = () => animateClose(onClose);

  const onSave = async () => {
    const success = await handleSave();
    if (success) {
      showToast('Score opgeslagen!');
      animateClose(() => {
        onSaved();
        onClose();
      });
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={handleClose}
      />

      <div
        ref={sheetRef}
        className="relative z-50 bg-white rounded-t-3xl px-6 pt-5 pb-8"
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        <div className="flex items-center gap-3 mb-5">
          <span className="text-3xl">{event.icon}</span>
          <div>
            <div className="font-medium text-gray-900">{event.name}</div>
            <div className="text-xs text-gray-400">{event.desc}</div>
          </div>
        </div>

        {sharedInfo && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-xl px-3 py-2 mb-3">
            {sharedInfo}
          </div>
        )}

        <Label>{event.label}</Label>
        <Input
          ref={inputRef}
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSave()}
          placeholder="0"
          min="0"
          inputMode="numeric"
          disabled={loadingShared}
          className="!text-2xl !h-14 text-center font-medium"
        />

        {loadingShared && (
          <p className="text-center text-gray-400 text-sm mt-2">Score ophalen...</p>
        )}

        <ErrorMessage message={error} />

        <Button
          variant="success"
          disabled={saving || loadingShared}
          onClick={onSave}
          className="mt-4"
        >
          {saving ? 'Opslaan...' : 'Opslaan'}
        </Button>
      </div>
    </div>
  );
}
