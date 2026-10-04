import React from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isSuccess = false,
  isError = false,
  disabled = false,
  className = '',
  icon,
  ...props
}) => {
  const sizeClasses = {
    sm: 'h-9 px-4 text-xs font-medium rounded-lg gap-1.5',
    md: 'h-11 px-5 text-sm font-semibold rounded-xl gap-2',
    lg: 'h-12 px-6 text-base font-semibold rounded-xl gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-[#451A03] text-white hover:bg-[#341402] active:bg-[#280F02] shadow-sm shadow-[#451a03]/25 focus-visible:ring-2 focus-visible:ring-[#451A03]/40 focus-visible:ring-offset-2',
    secondary:
      'bg-[#FDF8F5] text-[#451A03] hover:bg-[#F5EDE8] active:bg-[#EADBCE] border border-[#EADBCE] focus-visible:ring-2 focus-visible:ring-[#451A03]/30',
    outline:
      'border border-[#EADBCE] bg-white text-[#451A03] hover:bg-[#FDF8F5] hover:border-[#78350F] active:bg-[#F5EDE8] focus-visible:ring-2 focus-visible:ring-[#451A03]/30',
    ghost:
      'text-slate-600 hover:text-[#451A03] hover:bg-[#FDF8F5] active:bg-[#F5EDE8] focus-visible:ring-2 focus-visible:ring-[#451A03]/30',
    danger:
      'bg-[#D64545] text-white hover:bg-[#B83838] active:bg-[#9E2E2E] shadow-sm focus-visible:ring-2 focus-visible:ring-[#D64545]/40',
    success:
      'bg-[#159A6B] text-white hover:bg-[#118058] active:bg-[#0E6C4A] shadow-sm focus-visible:ring-2 focus-visible:ring-[#159A6B]/40',
  };

  const stateClass = isSuccess
    ? '!bg-[#159A6B] !text-white'
    : isError
    ? '!bg-[#D64545] !text-white'
    : '';

  return (
    <button
      disabled={disabled || isLoading}
      className={`relative inline-flex items-center justify-center transition-all duration-150 outline-none select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none whitespace-nowrap ${sizeClasses[size]} ${variantClasses[variant]} ${stateClass} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>{typeof children === 'string' ? 'Processing...' : children}</span>
        </>
      ) : isSuccess ? (
        <>
          <CheckCircle2 className="w-4 h-4" />
          <span>Success</span>
        </>
      ) : isError ? (
        <>
          <AlertCircle className="w-4 h-4" />
          <span>Error</span>
        </>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};
