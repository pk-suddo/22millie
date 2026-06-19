'use client';
import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-[#7C9A92] text-white hover:bg-[#6B8880] shadow-sm': variant === 'primary',
            'bg-[#F0EDE8] text-[#2D2D2D] hover:bg-[#E8E4DE] border border-[#E8E5E0]': variant === 'secondary',
            'bg-transparent text-[#6B7280] hover:bg-[#F0EDE8] hover:text-[#2D2D2D]': variant === 'ghost',
            'bg-[#F5E8E8] text-[#9A5A5A] hover:bg-[#EDD8D8]': variant === 'danger',
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-sm': size === 'md',
            'px-6 py-3 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
