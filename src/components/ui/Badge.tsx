import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'teal' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const variantStyles = {
    primary: 'bg-[#1769E0]/10 text-[#1769E0] border-[#1769E0]/20',
    success: 'bg-[#159A6B]/10 text-[#159A6B] border-[#159A6B]/20',
    teal: 'bg-[#16A394]/10 text-[#16A394] border-[#16A394]/20',
    warning: 'bg-[#E8A317]/10 text-[#B87A05] border-[#E8A317]/25',
    danger: 'bg-[#D64545]/10 text-[#D64545] border-[#D64545]/20',
    neutral: 'bg-[#F0F4FA] text-[#667085] border-[#E5EAF0]',
  };

  const dotColors = {
    primary: 'bg-[#1769E0]',
    success: 'bg-[#159A6B]',
    teal: 'bg-[#16A394]',
    warning: 'bg-[#E8A317]',
    danger: 'bg-[#D64545]',
    neutral: 'bg-[#667085]',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md font-medium',
    md: 'text-xs px-2.5 py-1 rounded-lg font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 border leading-none shrink-0 select-none whitespace-nowrap ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};
