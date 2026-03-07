'use client';

import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = '-- Selecteer --',
  className = '',
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label || placeholder;

  useEffect(() => {
    if (!listRef.current) return;

    if (open) {
      gsap.fromTo(
        listRef.current,
        { opacity: 0, y: -4 },
        { opacity: 1, y: 0, duration: 0.15, ease: 'power2.out' }
      );
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full h-11 px-4 text-sm border border-gray-200 rounded-full bg-white text-left outline-none transition-colors cursor-pointer flex items-center justify-between ${
          open ? 'border-[#04A4F2] ring-2 ring-[#04A4F2]/20' : ''
        } ${value ? 'text-gray-900' : 'text-gray-400'}`}
      >
        <span className="truncate">{selectedLabel}</span>
        <svg
          className={`shrink-0 text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M8 11L3 6h10z" />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-2xl max-h-60 overflow-auto py-1"
        >
          {options.map((option) => (
            <li
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`px-3 h-11 flex items-center text-sm cursor-pointer transition-colors ${
                option.value === value
                  ? 'bg-[#04A4F2]/10 text-[#04A4F2]'
                  : 'text-gray-900 hover:bg-gray-50'
              }`}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
