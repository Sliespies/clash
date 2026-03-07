import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'success';

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-[#04A4F2] text-white hover:bg-[#039AE0] disabled:bg-[#04A4F2]/30 disabled:text-white/60',
  secondary:
    'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300',
  success:
    'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export default function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`w-full h-11 px-4 text-sm font-medium rounded-full cursor-pointer transition-all active:scale-[0.97] disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
