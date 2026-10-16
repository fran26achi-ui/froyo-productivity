import React from 'react';
import { motion } from 'framer-motion';
import { AccessoryId, ShopAccessory } from '../types/froyo';

export const ACCESSORIES_CATALOG: Record<AccessoryId, ShopAccessory> = {
  crown: {
    id: 'crown',
    name: 'Tiny Golden Crown',
    category: 'Regal',
    cost: 150,
    description: 'Polished 24k gold crown with glowing ruby gems & star sparkles.',
    iconName: 'Crown',
  },
  pixel_glasses: {
    id: 'pixel_glasses',
    name: '8-Bit Pixel Shades',
    category: 'Cool',
    cost: 80,
    description: 'Classic retro pixel sunglasses with staircase glare reflections.',
    iconName: 'Glasses',
  },
  nightcap: {
    id: 'nightcap',
    name: 'Sleepy Star Nightcap',
    category: 'Cozy',
    cost: 60,
    description: 'Fluffy pastel periwinkle nightcap with moon print & fuzzy pom-pom.',
    iconName: 'Moon',
  },
  pastel_aura: {
    id: 'pastel_aura',
    name: 'Glowing Pastel Aura',
    category: 'Ethereal',
    cost: 200,
    description: 'Iridescent revolving stardust aura with floating celestial embers.',
    iconName: 'Sparkles',
  },
  coffee_cup: {
    id: 'coffee_cup',
    name: 'Miniature Latte Cup',
    category: 'Comfort',
    cost: 40,
    description: 'Warm pastel takeaway coffee with a heart sleeve & swirling steam.',
    iconName: 'Coffee',
  },
};

export const AccessoryVector: React.FC<{
  accessoryId: AccessoryId;
  scale?: number;
}> = ({ accessoryId }) => {
  const renderItem = () => {
    switch (accessoryId) {
    // 1. TINY GOLDEN CROWN
    case 'crown':
      return (
        <g id="accessory-crown">
          <defs>
            <linearGradient id="crownGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="40%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <radialGradient id="rubyGlow" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#FF758F" />
              <stop offset="100%" stopColor="#E11D48" />
            </radialGradient>
          </defs>

          {/* Floating Crown above head */}
          <motion.g
            animate={{ y: [0, -3, 0], rotate: [0, 1.5, -1.5, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Crown Base Shadow */}
            <ellipse cx="80" cy="38" rx="20" ry="4" fill="rgba(217, 119, 6, 0.25)" />

            {/* Crown Spikes Body */}
            <path
              d="M62 38 L60 20 L70 28 L80 14 L90 28 L100 20 L98 38 Q80 43 62 38 Z"
              fill="url(#crownGold)"
              stroke="#B45309"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />

            {/* Crown Rim Band */}
            <path
              d="M62 38 Q80 43 98 38 L98 40 Q80 45 62 40 Z"
              fill="#D97706"
              stroke="#B45309"
              strokeWidth="1.2"
            />

            {/* Jewels on peaks */}
            <circle cx="60" cy="19" r="2.5" fill="url(#rubyGlow)" stroke="#9F1239" strokeWidth="0.8" />
            <circle cx="80" cy="13" r="3.2" fill="#67E8F9" stroke="#0891B2" strokeWidth="0.8" />
            <circle cx="100" cy="19" r="2.5" fill="url(#rubyGlow)" stroke="#9F1239" strokeWidth="0.8" />

            {/* Inlaid Gems along Rim */}
            <circle cx="70" cy="36" r="1.8" fill="#34D399" />
            <circle cx="80" cy="37" r="2" fill="url(#rubyGlow)" />
            <circle cx="90" cy="36" r="1.8" fill="#34D399" />

            {/* Sparkles */}
            <path
              d="M74 12 Q76 12 76 10 Q76 12 78 12 Q76 12 76 14 Q76 12 74 12 Z"
              fill="#FEF08A"
            />
            <path
              d="M94 14 Q95 14 95 13 Q95 14 96 14 Q95 14 95 15 Q95 14 94 14 Z"
              fill="#FEF08A"
            />
          </motion.g>
        </g>
      );

    // 2. 8-BIT PIXEL SUNGLASSES
    case 'pixel_glasses':
      return (
        <g id="accessory-pixel-glasses">
          <motion.g
            animate={{ y: [0, -1.5, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Left Frame */}
            <rect x="52" y="65" width="22" height="15" rx="1" fill="#18181B" stroke="#09090B" strokeWidth="1.5" />
            {/* Right Frame */}
            <rect x="86" y="65" width="22" height="15" rx="1" fill="#18181B" stroke="#09090B" strokeWidth="1.5" />
            {/* Bridge */}
            <rect x="74" y="67" width="12" height="4" fill="#18181B" />

            {/* Left Pixel Stair Glare (White) */}
            <rect x="54" y="67" width="4" height="4" fill="#FFFFFF" />
            <rect x="58" y="71" width="4" height="4" fill="#FFFFFF" />
            <rect x="62" y="75" width="4" height="3" fill="#FFFFFF" />

            {/* Right Pixel Stair Glare (White) */}
            <rect x="88" y="67" width="4" height="4" fill="#FFFFFF" />
            <rect x="92" y="71" width="4" height="4" fill="#FFFFFF" />
            <rect x="96" y="75" width="4" height="3" fill="#FFFFFF" />

            {/* Side Arms */}
            <line x1="52" y1="67" x2="44" y2="65" stroke="#18181B" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="108" y1="67" x2="116" y2="65" stroke="#18181B" strokeWidth="2.5" strokeLinecap="round" />
          </motion.g>
        </g>
      );

    // 3. SLEEPY STAR NIGHTCAP
    case 'nightcap':
      return (
        <g id="accessory-nightcap">
          <defs>
            <linearGradient id="nightcapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C4B5FD" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>

          <motion.g
            animate={{ rotate: [-2, 2, -2] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Drooping Cone */}
            <path
              d="M58 42 Q68 18 96 16 Q122 16 118 40 Q116 52 110 56 Q106 46 96 36 Q78 30 58 42 Z"
              fill="url(#nightcapGrad)"
              stroke="#6D28D9"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />

            {/* White Cloud Brim */}
            <path
              d="M54 44 Q60 38 68 44 Q76 38 84 44 Q92 38 100 44 L100 48 Q92 44 84 48 Q76 44 68 48 Q60 44 54 48 Z"
              fill="#FFFFFF"
              stroke="#DDD6FE"
              strokeWidth="1.5"
            />

            {/* Golden Moon & Star Prints */}
            {/* Crescent Moon */}
            <path
              d="M80 24 A 4 4 0 0 0 85 28 A 3 3 0 0 1 81 24 Z"
              fill="#FDE047"
            />
            {/* Tiny Stars */}
            <circle cx="72" cy="30" r="1.4" fill="#FDE047" />
            <circle cx="92" cy="22" r="1.4" fill="#FDE047" />
            <circle cx="104" cy="32" r="1.2" fill="#FDE047" />

            {/* Fluffy Pom-Pom at the drooping end */}
            <motion.g
              animate={{ y: [0, 3, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <circle cx="110" cy="58" r="6" fill="#FFFFFF" stroke="#DDD6FE" strokeWidth="1.5" />
              <circle cx="108" cy="56" r="1.5" fill="#F5F3FF" />
            </motion.g>
          </motion.g>
        </g>
      );

    // 4. GLOWING PASTEL AURA
    case 'pastel_aura':
      return (
        <g id="accessory-pastel-aura">
          {/* Outer Pulsing Aura Ring */}
          <motion.ellipse
            cx="80"
            cy="84"
            rx="64"
            ry="64"
            fill="none"
            stroke="url(#auraRingGrad)"
            strokeWidth="3"
            strokeDasharray="6 8"
            animate={{
              rotate: [0, 360],
              scale: [0.98, 1.05, 0.98],
              opacity: [0.65, 0.95, 0.65],
            }}
            transition={{
              rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
              scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
              opacity: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
            }}
          />

          <defs>
            <linearGradient id="auraRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF85A1" />
              <stop offset="33%" stopColor="#A78BFA" />
              <stop offset="66%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#FCD34D" />
            </linearGradient>
          </defs>

          {/* Floating Stardust Particles */}
          <motion.circle
            cx="32"
            cy="52"
            r="3.5"
            fill="#FF85A1"
            opacity="0.8"
            animate={{ y: [0, -8, 0], scale: [1, 1.3, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.circle
            cx="128"
            cy="46"
            r="3"
            fill="#A78BFA"
            opacity="0.8"
            animate={{ y: [0, -6, 0], scale: [1, 1.4, 1] }}
            transition={{ duration: 3.1, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          />
          <motion.circle
            cx="24"
            cy="104"
            r="2.5"
            fill="#34D399"
            opacity="0.8"
            animate={{ y: [0, -5, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />
          <motion.circle
            cx="136"
            cy="108"
            r="3.2"
            fill="#FCD34D"
            opacity="0.8"
            animate={{ y: [0, -7, 0], scale: [1, 1.3, 1] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          />

          {/* Sparkle 4-point stars */}
          <motion.path
            d="M36 78 Q39 78 39 75 Q39 78 42 78 Q39 78 39 81 Q39 78 36 78 Z"
            fill="#FDE047"
            animate={{ scale: [0.8, 1.25, 0.8], rotate: [0, 90, 180] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.path
            d="M120 70 Q123 70 123 67 Q123 70 126 70 Q123 70 123 73 Q123 70 120 70 Z"
            fill="#FF85A1"
            animate={{ scale: [0.9, 1.3, 0.9], rotate: [0, -90, -180] }}
            transition={{ duration: 3.6, repeat: Infinity, delay: 0.8 }}
          />
        </g>
      );

    // 5. MINIATURE COFFEE CUP
    case 'coffee_cup':
      return (
        <g id="accessory-coffee-cup">
          {/* Positioned on bottom-right beside mascot */}
          <motion.g
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Cup Shadow */}
            <ellipse cx="126" cy="138" rx="10" ry="3" fill="rgba(61, 49, 53, 0.18)" />

            {/* Cup Body (Tapered) */}
            <path
              d="M118 116 L120 134 Q120 136 123 136 L129 136 Q132 136 132 134 L134 116 Z"
              fill="#FFF0F5"
              stroke="#FF85A1"
              strokeWidth="1.5"
            />

            {/* Kraft Heart Sleeve */}
            <path
              d="M118.5 122 L119.5 130 L132.5 130 L133.5 122 Z"
              fill="#FDE68A"
              stroke="#D97706"
              strokeWidth="1"
            />
            {/* Little Pink Heart on Sleeve */}
            <path
              d="M126 126 Q124.5 124 123.5 125 Q122.5 126.5 126 128.5 Q129.5 126.5 128.5 125 Q127.5 124 126 126 Z"
              fill="#FF85A1"
            />

            {/* Lid */}
            <rect x="116" y="113" width="20" height="3.5" rx="1.5" fill="#FF85A1" />
            <rect x="123" y="111.5" width="6" height="2" rx="0.8" fill="#FF85A1" />

            {/* Rising Steam Wisps */}
            <motion.path
              d="M123 108 Q121 103 124 99"
              fill="none"
              stroke="#FFA6C1"
              strokeWidth="1.5"
              strokeLinecap="round"
              animate={{ y: [0, -5, -10], opacity: [0, 0.8, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.path
              d="M128 107 Q130 102 127 98"
              fill="none"
              stroke="#FFA6C1"
              strokeWidth="1.5"
              strokeLinecap="round"
              animate={{ y: [0, -5, -10], opacity: [0, 0.8, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay: 0.9 }}
            />
          </motion.g>
        </g>
      );

    default:
      return null;
  }
};

return <g data-testid={`accessory-${accessoryId}`}>{renderItem()}</g>;
};
