import React from 'react';
import { motion } from 'framer-motion';

interface FroyoLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
}

export const FroyoLogo: React.FC<FroyoLogoProps> = ({
  size = 'md',
  className = '',
  animated = false,
}) => {
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-9 h-9',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const svgContent = (
    <svg
      viewBox="0 0 120 120"
      data-testid="froyo-logo"
      className={`${sizeMap[size]} ${className} shrink-0 select-none`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="flCupGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#FFE4EC" />
          <stop offset="100%" stopColor="#FFD1DF" />
        </linearGradient>

        <linearGradient id="flYogurt1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF5F8" />
          <stop offset="60%" stopColor="#FFA6C1" />
          <stop offset="100%" stopColor="#FF85A1" />
        </linearGradient>

        <linearGradient id="flYogurt2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FFE0E9" />
        </linearGradient>

        <radialGradient id="flCherryGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FF758F" />
          <stop offset="40%" stopColor="#E11D48" />
          <stop offset="100%" stopColor="#9F1239" />
        </radialGradient>

        <filter id="flGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#FF85A1" floodOpacity="0.22" />
        </filter>
      </defs>

      {/* Shadow */}
      <ellipse cx="60" cy="112" rx="34" ry="5.5" fill="#FCE7ED" opacity="0.8" />

      {/* The Froyo Cup */}
      <g filter="url(#flGlow)">
        <path
          d="M26 66 L34 104 Q35 108 40 108 L80 108 Q85 108 86 104 L94 66 Z"
          fill="url(#flCupGrad)"
          stroke="#FF85A1"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Cup Rim Scallop */}
        <path
          d="M24 66 Q30 63 36 66 Q42 63 48 66 Q54 63 60 66 Q66 63 72 66 Q78 63 84 66 Q90 63 96 66 L94 69 Q88 66 84 69 Q78 66 72 69 Q66 66 60 69 Q54 66 48 69 Q42 66 36 69 Q30 66 24 69 Z"
          fill="#FF85A1"
        />

        {/* Happy Face */}
        <path d="M47 84 Q52 79 57 84" fill="none" stroke="#65454E" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M63 84 Q68 79 73 84" fill="none" stroke="#65454E" strokeWidth="2.2" strokeLinecap="round" />
        <ellipse cx="43" cy="87" rx="3.5" ry="2" fill="#FF85A1" opacity="0.65" />
        <ellipse cx="77" cy="87" rx="3.5" ry="2" fill="#FF85A1" opacity="0.65" />
        <path d="M57 89 Q60 93 63 89" fill="none" stroke="#65454E" strokeWidth="2" strokeLinecap="round" />

        {/* Swirl Layers */}
        <path
          d="M22 66 Q20 54 36 50 Q48 46 60 48 Q72 46 84 50 Q100 54 98 66 Q88 71 60 70 Q32 71 22 66 Z"
          fill="url(#flYogurt1)"
          stroke="#FF85A1"
          strokeWidth="2.2"
        />
        <path
          d="M30 52 Q32 38 48 35 Q60 32 72 35 Q88 38 90 52 Q78 57 60 56 Q42 57 30 52 Z"
          fill="url(#flYogurt2)"
          stroke="#FFA6C1"
          strokeWidth="2"
        />
        <path
          d="M40 38 Q44 24 60 21 Q76 24 80 38 Q70 42 60 41 Q50 42 40 38 Z"
          fill="url(#flYogurt1)"
          stroke="#FF85A1"
          strokeWidth="1.8"
        />
        <path
          d="M52 24 Q60 14 66 12 Q64 18 68 23 Z"
          fill="#FFF0F5"
          stroke="#FF85A1"
          strokeWidth="1.5"
        />
      </g>

      {/* Sprinkles */}
      <rect x="42" y="44" width="5" height="2.2" rx="1.1" fill="#FBBF24" transform="rotate(-25 42 44)" />
      <rect x="74" y="46" width="5" height="2.2" rx="1.1" fill="#FBBF24" transform="rotate(35 74 46)" />
      <rect x="54" y="34" width="4.5" height="2" rx="1" fill="#34D399" transform="rotate(15 54 34)" />
      <rect x="36" y="58" width="4.5" height="2" rx="1" fill="#34D399" transform="rotate(-40 36 58)" />
      <rect x="66" y="32" width="4.5" height="2" rx="1" fill="#A78BFA" transform="rotate(-30 66 32)" />
      <rect x="80" y="58" width="5" height="2" rx="1" fill="#A78BFA" transform="rotate(20 80 58)" />
      <rect x="58" y="48" width="5" height="2.2" rx="1.1" fill="#F43F5E" transform="rotate(5 58 48)" />

      {/* Cherry on Top */}
      <g>
        <path d="M66 12 Q75 2 82 5" fill="none" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
        <path d="M74 4 Q79 2 80 5 Q77 7 74 4 Z" fill="#22C55E" />
        <circle cx="66" cy="13" r="7.5" fill="url(#flCherryGrad)" stroke="#BE123C" strokeWidth="1.2" />
        <ellipse cx="64" cy="10.5" rx="2" ry="1.2" fill="#FFFFFF" opacity="0.8" transform="rotate(-25 64 10.5)" />
      </g>

      {/* Sparkles */}
      <path
        d="M18 42 Q23 42 23 37 Q23 42 28 42 Q23 42 23 47 Q23 42 18 42 Z"
        fill="#FBBF24"
        opacity="0.9"
      />
      <path
        d="M98 34 Q101 34 101 31 Q101 34 104 34 Q101 34 101 37 Q101 34 98 34 Z"
        fill="#FF85A1"
        opacity="0.9"
      />
    </svg>
  );

  if (animated) {
    return (
      <motion.div
        animate={{ y: [0, -3, 0], rotate: [0, 1, -1, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ scale: 1.08 }}
      >
        {svgContent}
      </motion.div>
    );
  }

  return svgContent;
};
