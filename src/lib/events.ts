export interface GameEvent {
  name: string;
  type: 'time' | 'number';
  label: string;
  desc: string;
  icon: string;
  shared?: boolean;
}

export const EVENTS: GameEvent[] = [
  { name: 'Blazepods', type: 'time', label: 'Tijd (seconden)', desc: 'Voer je tijd in (seconden)', icon: '/sun-dim.svg' },
  { name: 'Copycat', type: 'number', label: 'Coins', desc: 'Voer het aantal coins in', icon: '/video-camera.svg' },
  { name: 'Fietsen', type: 'time', label: 'Tijd (seconden)', desc: 'Voer je tijd in (seconden)', icon: '/person-simple-bike.svg' },
  { name: 'VR', type: 'number', label: 'Bommen ontmanteld', desc: 'Voer het aantal ontmantelde bommen in', icon: '/virtual-reality.svg', shared: true },
  { name: 'Icaros', type: 'number', label: 'Doolhoven', desc: 'Voer het aantal doolhoven in', icon: '/path.svg', shared: true },
  { name: 'Firewall', type: 'number', label: 'Voltooide puzzels', desc: 'Voer het aantal voltooide puzzels in', icon: '/wall.svg', shared: true },
  { name: 'Axethrowing', type: 'number', label: 'Score', desc: 'Voer je score in', icon: '/axe.svg' },
  { name: 'Piccoo', type: 'number', label: 'Getikten', desc: 'Voer het aantal getikten in', icon: '/hand-pointing.svg', shared: true },
  { name: 'MakeyMakey', type: 'number', label: 'Score', desc: 'Voer je score in', icon: '/ghost.svg' },
  { name: 'Streetracket', type: 'number', label: 'Gescoorde ballen', desc: 'Voer het aantal gescoorde ballen in', icon: '/tennis-ball.svg', shared: true },
  { name: 'Roeien', type: 'number', label: 'Afstand (meter)', desc: 'Voer de afstand in (meter)', icon: '/sailboat.svg', shared: true },
];
