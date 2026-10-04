import React from 'react';

interface LogoProps {
  className?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark';
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  showTagline = true,
  size = 'md',
  variant = 'light',
  onClick,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
  };

  const textSizes = {
    sm: 'text-base sm:text-lg',
    md: 'text-lg sm:text-xl',
    lg: 'text-xl sm:text-2xl',
    xl: 'text-2xl sm:text-3xl',
  };

  const taglineSizes = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-[11px]',
    xl: 'text-[12px]',
  };

  const isDark = variant === 'dark';

  return (
    <div
      id="brand-logo"
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 sm:gap-3 select-none cursor-pointer group ${className}`}
    >
      {/* Profixa Stylized "P" Emblem with Gold Growth Bars & Arrow */}
      <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]}`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full transform transition-transform duration-200 group-hover:scale-105 drop-shadow-sm"
        >
          <defs>
            {/* Rich Background Gradient */}
            <linearGradient id="profixa-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2A1408" />
              <stop offset="50%" stopColor="#1E0D05" />
              <stop offset="100%" stopColor="#0F0602" />
            </linearGradient>

            {/* Radiant Gold Growth Gradient */}
            <linearGradient id="profixa-gold-grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#B45309" />
              <stop offset="40%" stopColor="#D97706" />
              <stop offset="70%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#FDE68A" />
            </linearGradient>

            {/* Metallic Border Gradient */}
            <linearGradient id="profixa-gold-border" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#78350F" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#D97706" stopOpacity="0.7" />
            </linearGradient>

            <filter id="profixa-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#F59E0B" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Rounded Squircle Container */}
          <rect
            x="2"
            y="2"
            width="44"
            height="44"
            rx="12"
            fill="url(#profixa-bg-grad)"
            stroke="url(#profixa-gold-border)"
            strokeWidth="1.5"
          />

          {/* White Vertical Stem of "P" */}
          <path
            d="M13 11C11.8954 11 11 11.8954 11 13V35C11 36.1046 11.8954 37 13 37H17.5C18.6046 37 19.5 36.1046 19.5 35V13C19.5 11.8954 18.6046 11 17.5 11H13Z"
            fill="#FFFFFF"
          />

          {/* Outer Loop of "P" */}
          <path
            d="M18 11H27C32.5228 11 37 15.0294 37 20C37 24.9706 32.5228 29 27 29H18V11Z"
            stroke="url(#profixa-gold-grad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Ascending Financial Growth Bars inside the loop */}
          {/* Bar 1 */}
          <rect x="21" y="22" width="2.6" height="4.5" rx="0.8" fill="url(#profixa-gold-grad)" />
          {/* Bar 2 */}
          <rect x="25" y="18" width="2.6" height="8.5" rx="0.8" fill="url(#profixa-gold-grad)" />
          {/* Bar 3 */}
          <rect x="29" y="14" width="2.6" height="12.5" rx="0.8" fill="url(#profixa-gold-grad)" />

          {/* Upward Profit Arrow sweeping through bars */}
          <path
            d="M20 25L32 13M32 13H27M32 13V18"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#profixa-glow)"
          />
        </svg>
      </div>

      {/* Brand Wordmark & Official Tagline */}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-baseline">
          <span
            className={`font-black tracking-tight ${
              isDark ? 'text-white' : 'text-[#2A1408]'
            } ${textSizes[size]}`}
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            Profi
          </span>
          <span
            className={`font-black tracking-tight bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 bg-clip-text text-transparent ${textSizes[size]}`}
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            xa
          </span>
        </div>

        {showTagline && (
          <span
            className={`font-semibold tracking-wider uppercase mt-0.5 sm:mt-1 ${
              isDark ? 'text-amber-400/90' : 'text-[#8C532E]'
            } ${taglineSizes[size]}`}
          >
            Your Effort • Our Profit
          </span>
        )}
      </div>
    </div>
  );
};
