import { ReactNode } from 'react';

interface SubtitleProps {
  children: ReactNode;
}

export default function Subtitle({ children }: SubtitleProps) {
  return (
    <h2 className="text-center text-gray-900 text-xl font-medium mb-6">{children}</h2>
  );
}
