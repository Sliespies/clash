import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-3xl p-5 sm:p-8 ${className}`}>
      {children}
    </div>
  );
}
