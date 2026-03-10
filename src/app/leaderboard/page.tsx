'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import Leaderboard from '@/components/Leaderboard';

export default function LeaderboardPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
    );
  }, []);

  return (
    <div className="w-full max-w-[520px] mx-auto px-4 py-5 sm:py-8">
      <div className="flex justify-center mb-5">
        <img src="/logo.svg" alt="Clash of the Companies" className="h-16 sm:h-24 w-auto" />
      </div>
      <div ref={containerRef} className="bg-white rounded-3xl p-5 sm:p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900 text-center mb-5">Klassement</h1>
        <Leaderboard />
      </div>
    </div>
  );
}
