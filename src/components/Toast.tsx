'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
}

export default function Toast({ message, visible, onHide }: ToastProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    if (visible) {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
      );
      const timeout = setTimeout(() => {
        gsap.to(ref.current, {
          opacity: 0,
          y: 20,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: onHide,
        });
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [visible, onHide]);

  if (!visible) return null;

  return (
    <div
      ref={ref}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md text-gray-900 px-6 py-3 rounded-xl shadow-lg font-medium text-[0.95rem] z-50 pointer-events-none flex items-center gap-2"
    >
      <span className="text-emerald-500 text-lg">&#10003;</span>
      {message}
    </div>
  );
}
