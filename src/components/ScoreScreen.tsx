'use client';

import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import type { GameEvent } from '@/lib/events';
import { Button, Input, Label, BackLink, ErrorMessage } from '@/components/ui';

interface ScoreScreenProps {
  event: GameEvent;
  company: string;
  userName: string;
  onSaved: () => void;
  onBack: () => void;
  showToast: (msg: string) => void;
}

export default function ScoreScreen({
  event,
  company,
  userName,
  onSaved,
  onBack,
  showToast,
}: ScoreScreenProps) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [sharedInfo, setSharedInfo] = useState('');
  const [sharedRow, setSharedRow] = useState<number | null>(null);
  const [loadingShared, setLoadingShared] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
    );

    if (event.shared) {
      setLoadingShared(true);
      (async () => {
        try {
          const res = await fetch('/api/sheets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get', range: 'Scores!A:E' }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          const rows: string[][] = data.values || [];
          for (let i = 0; i < rows.length; i++) {
            if (rows[i][0] === company && rows[i][2] === event.name) {
              setSharedRow(i + 1);
              setValue(rows[i][3] || '');
              setSharedInfo('Bestaande score gevonden — pas aan indien nodig');
              break;
            }
          }
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Kon score niet ophalen');
        } finally {
          setLoadingShared(false);
        }
      })();
    }

    inputRef.current?.focus();
  }, [event, company]);

  const handleSave = async () => {
    if (!value.trim() || isNaN(Number(value)) || Number(value) < 0) {
      setError('Voer een geldig getal in.');
      return;
    }

    setError('');
    setSaving(true);

    try {
      const timestamp = new Date().toLocaleString('nl-BE');
      const row = [company, userName, event.name, Number(value), timestamp];

      if (event.shared && sharedRow) {
        await fetch('/api/sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update',
            range: `Scores!A${sharedRow}:E${sharedRow}`,
            values: [row],
          }),
        });
      } else {
        await fetch('/api/sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'append',
            range: 'Scores!A:E',
            values: [row],
          }),
        });
      }

      showToast('Score opgeslagen!');
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Opslaan mislukt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={containerRef}>
      <div className="text-center mb-6">
        <div className="text-3xl mb-1">{event.icon}</div>
        <div className="text-xl font-medium text-gray-900">{event.name}</div>
        <div className="text-gray-500 text-sm mt-1">{event.desc}</div>
      </div>

      <Label className="text-center">{event.label}</Label>
      <Input
        ref={inputRef}
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        placeholder="0"
        min="0"
        inputMode="numeric"
        disabled={loadingShared}
        className="!text-2xl !h-14 text-center font-medium"
      />

      {loadingShared && (
        <p className="text-center text-gray-400 text-sm mt-2">Bestaande score ophalen...</p>
      )}
      {sharedInfo && (
        <p className="text-center text-gray-400 text-[0.85rem] mt-2">{sharedInfo}</p>
      )}

      <Button
        variant="success"
        disabled={saving || loadingShared}
        onClick={handleSave}
        className="mt-4"
      >
        {saving ? 'Opslaan...' : 'Opslaan'}
      </Button>

      <ErrorMessage message={error} />

      <BackLink onClick={onBack} className="mt-3" />
    </div>
  );
}
