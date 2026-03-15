'use client';

import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { Button, Select, Input, Label, Subtitle, ErrorMessage } from '@/components/ui';

interface SetupScreenProps {
  onNext: (company: string, name: string, participants: string[]) => void;
}

export default function SetupScreen({ onNext }: SetupScreenProps) {
  const [companies, setCompanies] = useState<string[]>([]);
  const [selected, setSelected] = useState('');
  const [name, setName] = useState('');
  const [participants, setParticipants] = useState<string[]>(['']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
    );

    (async () => {
      try {
        const res = await fetch('/api/sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get', range: 'Companies!A:A' }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        const rows: string[][] = data.values || [];
        setCompanies(rows.map((r: string[]) => r[0]?.trim()).filter(Boolean));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Verbinding mislukt');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filledParticipants = participants.filter(p => p.trim());

  const updateParticipant = (index: number, value: string) => {
    const updated = [...participants];
    updated[index] = value;
    setParticipants(updated);
  };

  const addParticipant = () => {
    if (participants.length < 10) {
      setParticipants([...participants, '']);
    }
  };

  const removeParticipant = (index: number) => {
    if (participants.length > 1) {
      setParticipants(participants.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = () => {
    if (selected && name.trim() && filledParticipants.length >= 1) {
      onNext(selected, name.trim(), filledParticipants);
    }
  };

  return (
    <div ref={containerRef}>
      <Subtitle>Welkom</Subtitle>

      <Label>Bedrijf</Label>
      <Select
        value={selected}
        onChange={setSelected}
        placeholder="-- Kies een bedrijf --"
        options={companies.map((c) => ({ value: c, label: c }))}
      />

      <Label className="mt-4">Naam van de trainer</Label>
      <Input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Naam trainer"
      />

      <Label className="mt-4">Deelnemers ({filledParticipants.length}/{participants.length})</Label>
      <div className="space-y-2">
        {participants.map((p, i) => (
          <div key={i} className="flex gap-2">
            <Input
              type="text"
              value={p}
              onChange={(e) => updateParticipant(i, e.target.value)}
              placeholder={`Deelnemer ${i + 1}`}
              className="flex-1"
            />
            {participants.length > 1 && (
              <button
                type="button"
                onClick={() => removeParticipant(i)}
                className="text-gray-400 hover:text-red-500 text-lg px-2 transition-colors"
              >
                &times;
              </button>
            )}
          </div>
        ))}
      </div>
      {participants.length < 10 && (
        <button
          type="button"
          onClick={addParticipant}
          className="text-sm text-[#04A4F2] hover:underline mt-2"
        >
          + Deelnemer toevoegen
        </button>
      )}

      <Button
        disabled={!selected || !name.trim() || filledParticipants.length < 1}
        onClick={handleSubmit}
        className="mt-6"
      >
        Start
      </Button>

      {loading && <p className="text-center text-gray-400 py-10">Verbinden...</p>}
      <ErrorMessage message={error ? `Verbinding mislukt: ${error}` : ''} />
    </div>
  );
}
