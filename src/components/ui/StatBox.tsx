import { forwardRef } from 'react';

interface StatItem {
  label: string;
  value: string;
  id: string;
  color: 'green' | 'red' | 'indigo';
}

interface StatBoxProps {
  items: StatItem[];
}

const bgClasses = {
  green: 'bg-emerald-50',
  red: 'bg-red-50',
  indigo: 'bg-indigo-50',
};

const textClasses = {
  green: 'text-emerald-600',
  red: 'text-red-600',
  indigo: 'text-indigo-600',
};

const labelClasses = {
  green: 'text-emerald-400',
  red: 'text-red-400',
  indigo: 'text-indigo-400',
};

const StatBox = forwardRef<HTMLDivElement, StatBoxProps>(({ items }, ref) => {
  return (
    <div ref={ref} className="grid grid-cols-3 gap-2 mb-4">
      {items.map((item) => (
        <div
          key={item.id}
          className={`${bgClasses[item.color]} rounded-2xl p-3 text-center`}
        >
          <div className={`text-[0.7rem] ${labelClasses[item.color]} uppercase tracking-wide mb-1`}>{item.label}</div>
          <div id={item.id} className={`text-xl font-semibold ${textClasses[item.color]}`}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
});

StatBox.displayName = 'StatBox';
export default StatBox;
