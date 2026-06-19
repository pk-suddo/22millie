import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-[#4A4A4A]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5E0] bg-[#FAFAF8] text-[#2D2D2D] text-sm',
            'placeholder:text-[#B0ACA8]',
            'focus:outline-none focus:border-[#7C9A92] focus:bg-white focus:ring-2 focus:ring-[#7C9A92]/10',
            'transition-all duration-150',
            error && 'border-[#C4827A] focus:border-[#C4827A] focus:ring-[#C4827A]/10',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-[#C4827A]">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';
