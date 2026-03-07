'use client';

import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { Button, Input, Label, BackLink, Subtitle } from '@/components/ui';

interface NameScreenProps {
  onNext: (name: string) => void;
  onBack: () => void;
}

export default function NameScreen({ onNext, onBack }: NameScreenProps) {
  const [name, setName] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
    );
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (name.trim()) onNext(name.trim());
  };

  return (
    <div ref={containerRef}>
      <Subtitle>Vul je naam in</Subtitle>

      <Label>Naam</Label>
      <Input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder="Je volledige naam"
      />

      <Button disabled={!name.trim()} onClick={handleSubmit} className="mt-4">
        Volgende
      </Button>

      <BackLink onClick={onBack} className="mt-3" />
    </div>
  );
}
