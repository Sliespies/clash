import Image from 'next/image';

const sizeMap: Record<string, number> = {
  'text-base': 16,
  'text-lg': 18,
  'text-xl': 20,
  'text-2xl': 24,
  'text-3xl': 30,
  'text-4xl': 36,
  'text-5xl': 48,
};

function getSize(className: string): number {
  for (const [key, value] of Object.entries(sizeMap)) {
    if (className.includes(key)) return value;
  }
  return 32;
}

interface EventIconProps {
  icon: string;
  className?: string;
}

export default function EventIcon({ icon, className = '' }: EventIconProps) {
  if (icon.startsWith('/')) {
    const size = getSize(className);
    return <Image src={icon} alt="" width={size} height={size} />;
  }
  return <span className={className}>{icon}</span>;
}
