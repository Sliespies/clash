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
  const [existingInfo, setExistingInfo] = useState('');
  const [existingRow, setExistingRow] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setValue('');
    setError('');
    setExistingInfo('');
    setExistingRow(null);
    setLoading(true);

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
          const matchesEvent = rows[i][2] === event.name;
          const matchesCompany = rows[i][0] === company;
          const matchesUser = rows[i][1] === userName;

          if (matchesEvent && matchesCompany && (event.shared || matchesUser)) {
            setExistingRow(i + 1);
            setValue(rows[i][3] || '');
            const enteredBy = rows[i][1] || '';
            if (event.shared && enteredBy && enteredBy !== userName) {
              setExistingInfo(`Score ${rows[i][3]} ingevoerd door ${enteredBy} — pas aan indien nodig`);
            } else {
              setExistingInfo(`Bestaande score: ${rows[i][3]} — pas aan indien nodig`);
            }
            break;
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Kon score niet ophalen');
      } finally {
        setLoading(false);
      }
    })();
  }, [event, company, userName]);

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

      if (existingRow) {
        await fetch('/api/sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update',
            range: `Scores!A${existingRow}:E${existingRow}`,
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
  }, [value, company, userName, event, existingRow]);

  return { value, setValue, saving, error, setError, existingInfo, loading, handleSave };
}
