import Image from 'next/image';

interface EventIconProps {
  icon: string;
  className?: string;
}

export default function EventIcon({ icon, className = '' }: EventIconProps) {
  if (icon.startsWith('/')) {
    return <Image src={icon} alt="" width={32} height={32} className={className} />;
  }
  return <span className={className}>{icon}</span>;
}
