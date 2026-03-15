export type Phase = 'all' | 1 | 2 | 3 | 4;

export interface GameEvent {
  name: string;
  type: 'time' | 'number';
  label: string;
  desc: string;
  icon: string;
  phase: Phase;
  shared?: boolean;       // one score per company (trainer enters once)
  needsParticipants?: boolean; // show participant checkboxes (for uniqueNames bonus)
}

export const PHASES: { phase: Phase; label: string; color: string }[] = [
  { phase: 'all', label: 'Alle Fasen', color: 'text-green-600' },
  { phase: 1, label: 'Fase 1 — Team', color: 'text-yellow-600' },
  { phase: 2, label: 'Fase 2 — Gezamenlijk', color: 'text-red-500' },
  { phase: 3, label: 'Fase 3 — Team', color: 'text-blue-600' },
  { phase: 4, label: 'Fase 4 — Gezamenlijk', color: 'text-orange-500' },
];

export const EVENTS: GameEvent[] = [
  // Alle Fasen
  { name: 'Roeien', type: 'number', label: 'Afstand (meter)', desc: 'Voer de afstand in (meter)', icon: '/sailboat.svg', phase: 'all', shared: true },
  // Fase 1 — Team
  { name: 'Copycat', type: 'number', label: 'Coins', desc: 'Voer het aantal coins in', icon: '/video-camera.svg', phase: 1 },
  { name: 'Icaros', type: 'number', label: 'Doolhoven', desc: 'Voer het aantal doolhoven in', icon: '/path.svg', phase: 1, shared: true, needsParticipants: true },
  { name: 'Blazepods', type: 'time', label: 'Tijd (seconden)', desc: 'Voer de tijd in (seconden)', icon: '/sun-dim.svg', phase: 1 },
  { name: 'Fietsen', type: 'time', label: 'Tijd (seconden)', desc: 'Voer de tijd in (seconden)', icon: '/person-simple-bike.svg', phase: 1 },
  // Fase 2 — Gezamenlijk
  { name: 'Firewall', type: 'number', label: 'Voltooide puzzels', desc: 'Voer het aantal voltooide puzzels in', icon: '/wall.svg', phase: 2, shared: true },
  // Fase 3 — Team
  { name: 'VR', type: 'number', label: 'Bommen ontmanteld', desc: 'Voer het aantal ontmantelde bommen in', icon: '/virtual-reality.svg', phase: 3, shared: true, needsParticipants: true },
  { name: 'Axethrowing', type: 'number', label: 'Score', desc: 'Voer de score in', icon: '/axe.svg', phase: 3 },
  { name: 'PacMan', type: 'number', label: 'Score', desc: 'Voer de score in', icon: '/ghost.svg', phase: 3 },
  { name: 'Streetracket', type: 'number', label: 'Gescoorde ballen', desc: 'Voer het aantal gescoorde ballen in', icon: '/tennis-ball.svg', phase: 3, shared: true },
  // Fase 4 — Gezamenlijk
  { name: 'Piccoo', type: 'number', label: 'Getikten', desc: 'Voer het aantal getikten in', icon: '/hand-pointing.svg', phase: 4, shared: true },
];
