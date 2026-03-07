import { LabelHTMLAttributes } from 'react';

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export default function Label({ className = '', children, ...props }: LabelProps) {
  return (
    <label
      className={`block text-sm text-gray-600 mb-2 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}
