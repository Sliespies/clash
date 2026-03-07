import { ArrowLeft } from 'lucide-react';

interface BackLinkProps {
  onClick: () => void;
  className?: string;
}

export default function BackLink({ onClick, className = '' }: BackLinkProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-center gap-1.5 text-gray-400 text-[0.85rem] cursor-pointer bg-transparent border-none hover:text-gray-600 transition-colors ${className}`}
    >
      <ArrowLeft size={14} />
      Terug
    </button>
  );
}
