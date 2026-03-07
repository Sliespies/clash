'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GameEvent } from '@/lib/events';

interface UseScoreEntryProps {
  event: GameEvent;
  company: string;
  userName: string;
}

export function useScoreEntry({ event, company, userName }: UseScoreEntryProps) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [sharedInfo, setSharedInfo] = useState('');
  const [sharedRow, setSharedRow] = useState<number | null>(null);
  const [loadingShared, setLoadingShared] = useState(false);

  useEffect(() => {
    setValue('');
    setError('');
    setSharedInfo('');
    setSharedRow(null);

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
  }, [event, company]);

  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!value.trim() || isNaN(Number(value)) || Number(value) < 0) {
      setError('Voer een geldig getal in.');
      return false;
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

      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Opslaan mislukt');
      return false;
    } finally {
      setSaving(false);
    }
  }, [value, company, userName, event, sharedRow]);

  return { value, setValue, saving, error, sharedInfo, loadingShared, handleSave };
}
