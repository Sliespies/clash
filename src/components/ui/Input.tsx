import { InputHTMLAttributes, forwardRef } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full h-11 px-4 text-sm border border-gray-200 rounded-full bg-white text-gray-900 outline-none transition-colors focus:border-[#04A4F2] focus:ring-2 focus:ring-[#04A4F2]/20 disabled:opacity-50 ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
export default Input;
