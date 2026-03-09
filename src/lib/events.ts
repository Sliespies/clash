export interface GameEvent {
  name: string;
  type: 'time' | 'number';
  label: string;
  desc: string;
  icon: string;
  shared?: boolean;
}

export const EVENTS: GameEvent[] = [
  { name: 'Blazepods', type: 'time', label: 'Tijd (seconden)', desc: 'Voer je tijd in (seconden)', icon: '⚡' },
  { name: 'Copycat', type: 'number', label: 'Coins', desc: 'Voer het aantal coins in', icon: '🪙' },
  { name: 'Fietsen', type: 'time', label: 'Tijd (seconden)', desc: 'Voer je tijd in (seconden)', icon: '🚴' },
  { name: 'VR', type: 'number', label: 'Bommen ontmanteld', desc: 'Voer het aantal ontmantelde bommen in', icon: '🥽', shared: true },
  { name: 'Icaros', type: 'number', label: 'Levels', desc: 'Voer het aantal levels in', icon: '🦅', shared: true },
  { name: 'Firewall', type: 'number', label: 'Voltooide puzzels', desc: 'Voer het aantal voltooide puzzels in', icon: '🔥', shared: true },
  { name: 'Axethrowing', type: 'number', label: 'Score', desc: 'Voer je score in', icon: '🪓' },
  { name: 'Piccoo', type: 'number', label: 'Getikten', desc: 'Voer het aantal getikten in', icon: '👆', shared: true },
  { name: 'MakeyMakey', type: 'number', label: 'Score', desc: 'Voer je score in', icon: '🎹' },
  { name: 'Streetracket', type: 'number', label: 'Gescoorde ballen', desc: 'Voer het aantal gescoorde ballen in', icon: '🏓', shared: true },
  { name: 'Roeien', type: 'number', label: 'Afstand (meter)', desc: 'Voer de afstand in (meter)', icon: '🚣', shared: true },
];
