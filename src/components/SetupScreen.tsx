'use client';

import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { Button, Select, Input, Label, Subtitle, ErrorMessage } from '@/components/ui';

interface SetupScreenProps {
  onNext: (company: string, name: string) => void;
}

export default function SetupScreen({ onNext }: SetupScreenProps) {
  const [companies, setCompanies] = useState<string[]>([]);
  const [selected, setSelected] = useState('');
  const [name, setName] = useState('');
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

  const handleSubmit = () => {
    if (selected && name.trim()) {
      onNext(selected, name.trim());
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

      <Label className="mt-4">Naam</Label>
      <Input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder="Je volledige naam"
      />

      <Button
        disabled={!selected || !name.trim()}
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
