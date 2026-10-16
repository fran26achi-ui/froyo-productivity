import React from 'react';
import { motion } from 'framer-motion';
import {
  AccessoryId,
  FocusMascotActivity,
  MascotHealthState,
  MascotType,
} from '../types/froyo';
import { AccessoryVector } from './MascotAccessories';

export const MASCOT_CATALOG: Record<
  MascotType,
  {
    id: MascotType;
    name: string;
    category: string;
    subtitle: string;
    flourishingDesc: string;
    neutralDesc: string;
    degradedDesc: string;
  }
> = {
  flora: {
    id: 'flora',
    name: 'Mochi Sprout',
    category: 'Flora',
    subtitle: 'Sakura Succulent',
    flourishingDesc: 'Blooming sakura petals & lush emerald leaves!',
    neutralDesc: 'Photosynthesizing calmly in its pastel pot.',
    degradedDesc: 'Wilting stems & dropping dry leaves — complete tasks to water!',
  },
  fauna: {
    id: 'fauna',
    name: 'Neko-Byte',
    category: 'Fauna',
    subtitle: 'Cyber-Cat Shiba',
    flourishingDesc: 'Purring at max frequency with holographic heart emitters!',
    neutralDesc: 'Observing your workflow with steady ear LEDs.',
    degradedDesc: 'Neglected, sleepy & low-power visor — needs task momentum!',
  },
  mythical: {
    id: 'mythical',
    name: 'Pyro Puffs',
    category: 'Mythical',
    subtitle: 'Baby Starlight Dragon',
    flourishingDesc: 'Breathing warm starlight embers & fluttering wings!',
    neutralDesc: 'Perched cozily keeping your deadlines warm.',
    degradedDesc: 'Covered in soot with sputtering smoke — rekindle the flame!',
  },
  mechanical: {
    id: 'mechanical',
    name: 'Beeper-01',
    category: 'Mechanical',
    subtitle: 'Desktop Companion Bot',
    flourishingDesc: 'Battery at 100% with overclocked pixel heart display!',
    neutralDesc: 'Running standard productivity diagnostics.',
    degradedDesc: 'Chassis rusting & antenna sparking — urgent maintenance required!',
  },
  chihuahua: {
    id: 'chihuahua',
    name: 'Peanut',
    category: 'Fauna',
    subtitle: 'Feisty Pocket Chihuahua',
    flourishingDesc: 'Bursting with giant energetic puppy zoomies and sparkling golden aura!',
    neutralDesc: 'Alert oversized ears perked up watching your cursor.',
    degradedDesc: 'Trembling in a blanket with droopy ears and sad puppy tears.',
  },
  german_shepherd: {
    id: 'german_shepherd',
    name: 'Kaiser',
    category: 'Fauna',
    subtitle: 'Noble Guardian Shepherd',
    flourishingDesc: 'Proudly sporting a gold medal with playful panting and flying star treats!',
    neutralDesc: 'Diligently guarding your task deadlines with alert posture.',
    degradedDesc: 'Head resting on paws whimpering with muddy patches.',
  },
  cupcake: {
    id: 'cupcake',
    name: 'Sprinkles',
    category: 'Pastry',
    subtitle: 'Strawberry Cream Cupcake',
    flourishingDesc: 'Freshly baked with exploding rainbow sprinkles and a glistening ruby cherry!',
    neutralDesc: 'Swirling strawberry buttercream with a cozy smile.',
    degradedDesc: 'Melted lopsided frosting with stale speckles and a bruised cherry.',
  },
  capybara: {
    id: 'capybara',
    name: 'Yuzu-Bara',
    category: 'Fauna',
    subtitle: 'Zen Master Capybara',
    flourishingDesc: 'Steaming in a pastel onsen with a gleaming golden yuzu and floating petals!',
    neutralDesc: 'Perfect serenity with an orange perched steadily on its head.',
    degradedDesc: 'Shivering and soggy with a bruised fruit sliding off its head.',
  },
  pickle: {
    id: 'pickle',
    name: 'Sir Dill',
    category: 'Gourmet',
    subtitle: 'Crunchy Dill Pickle',
    flourishingDesc: 'Rocking cool sunglasses, shooting brine sparkles and electric confetti!',
    neutralDesc: 'Extra crunchy jar pickle with friendly smile and rosy cheeks.',
    degradedDesc: 'Shriveled and floppy with sour puddle and dizzy x_x eyes.',
  },
};

interface MascotCompanionProps {
  mascot: MascotType;
  healthState: MascotHealthState;
  healthScore: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  focusActivity?: FocusMascotActivity | null;
  equippedAccessory?: AccessoryId | null;
}

export const MascotCompanion: React.FC<MascotCompanionProps> = ({
  mascot,
  healthState,
  healthScore,
  size = 'md',
  focusActivity = null,
  equippedAccessory = null,
}) => {
  const dimensions = {
    sm: 'w-14 h-14',
    md: 'w-24 h-24',
    lg: 'w-36 h-36',
    xl: 'w-52 h-52',
  }[size];

  const isFlourishing = healthState === 'flourishing' && !focusActivity;
  const isDegraded = healthState === 'degraded' && !focusActivity;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${dimensions}`}
      data-testid="mascot-companion"
      data-mascot-type={mascot}
      data-mascot-state={healthState}
      data-mascot-activity={focusActivity || 'none'}
      title={`${MASCOT_CATALOG[mascot]?.name || mascot} (${healthState.toUpperCase()} — ${healthScore} HP)`}
    >
      {/* Ambient Aura Glow */}
      <motion.div
        className="absolute inset-1 rounded-full blur-xl pointer-events-none"
        style={{
          background: focusActivity
            ? 'radial-gradient(circle, rgba(255,133,161,0.28) 0%, rgba(139,92,246,0.08) 70%)'
            : isFlourishing
            ? 'radial-gradient(circle, rgba(255,133,161,0.38) 0%, rgba(52,211,153,0.18) 70%)'
            : isDegraded
            ? 'radial-gradient(circle, rgba(239,68,68,0.22) 0%, rgba(120,113,108,0.12) 70%)'
            : 'radial-gradient(circle, rgba(255,166,193,0.22) 0%, transparent 70%)',
        }}
        animate={{
          scale: isFlourishing ? [1, 1.14, 1] : [1, 1.05, 1],
          opacity: isFlourishing ? [0.7, 1, 0.7] : [0.45, 0.7, 0.45],
        }}
        transition={{ duration: isFlourishing ? 2.4 : 3.8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.svg
        viewBox="0 0 160 160"
        className="w-full h-full overflow-visible relative z-10"
        animate={
          focusActivity === 'meditating'
            ? { y: [0, -7, 0] }
            : focusActivity === 'sleeping'
            ? { scale: [1, 1.03, 1] }
            : isFlourishing
            ? { y: [0, -5, 0], rotate: [0, 1.5, -1.5, 0] }
            : isDegraded
            ? { y: [2, 4, 2], rotate: [-2, -3.5, -2] }
            : { y: [0, -2.5, 0] }
        }
        transition={{
          duration: focusActivity === 'sleeping' ? 4 : isFlourishing ? 2.2 : 3.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Meditating Halo Ring in Focus Mode */}
        {focusActivity === 'meditating' && (
          <motion.ellipse
            cx="80"
            cy="138"
            rx="46"
            ry="10"
            fill="none"
            stroke="#FF85A1"
            strokeWidth="2.5"
            strokeDasharray="8 6"
            animate={{ scaleX: [0.92, 1.08, 0.92], opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        )}

        {/* Base Shadow */}
        <ellipse
          cx="80"
          cy="142"
          rx="40"
          ry="7"
          fill={isDegraded ? 'rgba(87, 83, 78, 0.25)' : 'rgba(255, 133, 161, 0.20)'}
        />

        {/* 1. FLORA */}
        {mascot === 'flora' && (
          <FloraSucculentVector state={healthState} focusActivity={focusActivity} />
        )}
        {/* 2. FAUNA */}
        {mascot === 'fauna' && (
          <FaunaCyberCatVector state={healthState} focusActivity={focusActivity} />
        )}
        {/* 3. MYTHICAL */}
        {mascot === 'mythical' && (
          <MythicalDragonVector state={healthState} focusActivity={focusActivity} />
        )}
        {/* 4. MECHANICAL */}
        {mascot === 'mechanical' && (
          <MechanicalBotVector state={healthState} focusActivity={focusActivity} />
        )}
        {/* 5. CHIHUAHUA */}
        {mascot === 'chihuahua' && (
          <ChihuahuaVector state={healthState} focusActivity={focusActivity} />
        )}
        {/* 6. GERMAN SHEPHERD */}
        {mascot === 'german_shepherd' && (
          <GermanShepherdVector state={healthState} focusActivity={focusActivity} />
        )}
        {/* 7. CUPCAKE */}
        {mascot === 'cupcake' && (
          <CupcakeVector state={healthState} focusActivity={focusActivity} />
        )}
        {/* 8. CAPYBARA */}
        {mascot === 'capybara' && (
          <CapybaraVector state={healthState} focusActivity={focusActivity} />
        )}
        {/* 9. PICKLE */}
        {mascot === 'pickle' && (
          <PickleVector state={healthState} focusActivity={focusActivity} />
        )}

        {/* Universal Accessory Layer (Equipped from Sanctuary Shop) */}
        {equippedAccessory && (
          <AccessoryVector accessoryId={equippedAccessory} />
        )}

        {/* Flourishing Particle Overlay */}
        {isFlourishing && (
          <g data-testid="mascot-flourishing-particles">
            <motion.circle
              cx="28"
              cy="44"
              r="4"
              fill="#FF85A1"
              animate={{ y: [0, -14, 0], opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 2.1, repeat: Infinity }}
            />
            <motion.circle
              cx="134"
              cy="38"
              r="3.5"
              fill="#34D399"
              animate={{ y: [0, -12, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: 0.4 }}
            />
            <motion.path
              d="M126 68 L129 61 L132 68 L139 71 L132 74 L129 81 L126 74 L119 71 Z"
              fill="#FBBF24"
              animate={{ scale: [0.7, 1.15, 0.7], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </g>
        )}

        {/* Degraded / Rotting Visual Effects */}
        {isDegraded && (
          <g data-testid="mascot-degraded-effects">
            <motion.path
              d="M32 52 Q24 62 30 70 Q38 62 32 52 Z"
              fill={mascot === 'mechanical' ? '#EF4444' : '#A8A29E'}
              animate={{ y: [0, 26], opacity: [0.9, 0], rotate: [0, 45] }}
              transition={{ duration: 2.3, repeat: Infinity }}
            />
            <motion.path
              d="M128 58 Q120 68 126 76 Q134 68 128 58 Z"
              fill={mascot === 'mechanical' ? '#F59E0B' : '#78716C'}
              animate={{ y: [0, 24], opacity: [0.85, 0], rotate: [0, -35] }}
              transition={{ duration: 2.6, repeat: Infinity, delay: 0.8 }}
            />
          </g>
        )}

        {/* Focus Activity Contextual Overlays */}
        {focusActivity === 'sleeping' && (
          <g data-testid="mascot-focus-sleeping">
            <motion.text
              x="114"
              y="48"
              fill="#FFA6C1"
              fontSize="16"
              fontWeight="700"
              animate={{ y: [48, 32], x: [114, 124], opacity: [0, 1, 0] }}
              transition={{ duration: 2.8, repeat: Infinity }}
            >
              Zzz
            </motion.text>
            <motion.text
              x="126"
              y="34"
              fill="#C084FC"
              fontSize="12"
              fontWeight="700"
              animate={{ y: [34, 18], x: [126, 134], opacity: [0, 0.9, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, delay: 1.2 }}
            >
              z
            </motion.text>
          </g>
        )}

        {focusActivity === 'reading' && (
          <g data-testid="mascot-focus-reading" transform="translate(46, 112)">
            <path
              d="M4 18 Q18 12 34 18 Q50 12 64 18 L64 6 Q50 0 34 6 Q18 0 4 6 Z"
              fill="#FFF5F7"
              stroke="#FF85A1"
              strokeWidth="2.2"
            />
            <line x1="34" y1="6" x2="34" y2="18" stroke="#FF85A1" strokeWidth="2" />
          </g>
        )}
      </motion.svg>
    </div>
  );
};

/* 1. FLORA */
const FloraSucculentVector: React.FC<{
  state: MascotHealthState;
  focusActivity: FocusMascotActivity | null;
}> = ({ state, focusActivity }) => {
  const isFlourishing = state === 'flourishing';
  const isDegraded = state === 'degraded';
  const leafPrimary = isDegraded ? '#9CA37B' : isFlourishing ? '#34D399' : '#4ADE80';
  const leafSecondary = isDegraded ? '#787D62' : isFlourishing ? '#10B981' : '#22C55E';

  return (
    <g>
      <g transform={isDegraded ? 'translate(6, 10) rotate(8 80 80)' : 'translate(0, 0)'}>
        <ellipse cx="56" cy="68" rx="18" ry="26" transform="rotate(-28 56 68)" fill={leafSecondary} />
        <ellipse cx="104" cy="68" rx="18" ry="26" transform="rotate(28 104 68)" fill={leafSecondary} />
        <ellipse cx="80" cy="58" rx="22" ry="30" fill={leafPrimary} />

        {isFlourishing && (
          <g transform="translate(80, 26)">
            <circle cx="-8" cy="-4" r="7" fill="#FF85A1" />
            <circle cx="8" cy="-4" r="7" fill="#FF85A1" />
            <circle cx="-5" cy="7" r="7" fill="#FFA6C1" />
            <circle cx="5" cy="7" r="7" fill="#FFA6C1" />
            <circle cx="0" cy="-9" r="7" fill="#FFA6C1" />
            <circle cx="0" cy="0" r="5" fill="#FDE047" />
          </g>
        )}
        {isDegraded && <path d="M108 78 Q128 88 124 104 Q108 98 108 78 Z" fill="#A16207" />}
      </g>
      <path
        d="M44 82 L116 82 L106 134 C105 138 100 140 95 140 L65 140 C60 140 55 138 54 134 Z"
        fill={isDegraded ? '#D6C7C2' : '#FFE4EC'}
        stroke="#FF85A1"
        strokeWidth="3"
      />
      <rect x="38" y="74" width="84" height="12" rx="6" fill="#FFB3C6" stroke="#FF85A1" strokeWidth="2.5" />
      {isDegraded && <path d="M94 86 L88 98 L95 104 L90 116" fill="none" stroke="#78716C" strokeWidth="2" strokeLinecap="round" />}
      {focusActivity === 'sleeping' || focusActivity === 'meditating' ? (
        <g stroke="#3D3135" strokeWidth="2.5" fill="none" strokeLinecap="round">
          <path d="M62 106 Q67 111 72 106" />
          <path d="M88 106 Q93 111 98 106" />
          <path d="M76 116 Q80 119 84 116" />
        </g>
      ) : isDegraded ? (
        <g stroke="#3D3135" strokeWidth="2.5" fill="none" strokeLinecap="round">
          <path d="M63 103 L71 109 M71 103 L63 109" />
          <path d="M89 103 L97 109 M97 103 L89 109" />
          <path d="M73 120 Q80 113 87 120" />
        </g>
      ) : (
        <g>
          <circle cx="66" cy="106" r="3.8" fill="#3D3135" />
          <circle cx="94" cy="106" r="3.8" fill="#3D3135" />
          <ellipse cx="58" cy="112" rx="5" ry="3" fill="#FF85A1" opacity="0.6" />
          <ellipse cx="102" cy="112" rx="5" ry="3" fill="#FF85A1" opacity="0.6" />
          <path d={isFlourishing ? 'M73 112 Q80 121 87 112' : 'M75 114 Q80 118 85 114'} fill="none" stroke="#3D3135" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}
    </g>
  );
};

/* 2. FAUNA */
const FaunaCyberCatVector: React.FC<{
  state: MascotHealthState;
  focusActivity: FocusMascotActivity | null;
}> = ({ state, focusActivity }) => {
  const isFlourishing = state === 'flourishing';
  const isDegraded = state === 'degraded';

  return (
    <g>
      <polygon points={isDegraded ? '36,68 48,38 68,54' : '42,62 46,24 72,48'} fill="#FFD6E0" stroke="#FF85A1" strokeWidth="3" strokeLinejoin="round" />
      <polygon points={isDegraded ? '124,68 112,38 92,54' : '118,62 114,24 88,48'} fill="#FFD6E0" stroke="#FF85A1" strokeWidth="3" strokeLinejoin="round" />
      <rect x="40" y="46" width="80" height="76" rx="36" fill={isDegraded ? '#E5DCE0' : '#FFF0F5'} stroke="#FF85A1" strokeWidth="3" />
      <rect x="48" y="66" width="64" height="24" rx="12" fill="#231C20" stroke={isFlourishing ? '#34D399' : isDegraded ? '#EF4444' : '#FF85A1'} strokeWidth="2" />
      {focusActivity === 'sleeping' || focusActivity === 'meditating' ? (
        <g stroke="#FF85A1" strokeWidth="2.5" fill="none" strokeLinecap="round">
          <path d="M58 78 Q64 83 70 78" />
          <path d="M90 78 Q96 83 102 78" />
        </g>
      ) : isFlourishing ? (
        <g stroke="#34D399" strokeWidth="2.8" fill="none" strokeLinecap="round">
          <path d="M58 81 L64 74 L70 81" />
          <path d="M90 81 L96 74 L102 81" />
        </g>
      ) : isDegraded ? (
        <g stroke="#EF4444" strokeWidth="2.5" fill="none" strokeLinecap="round">
          <line x1="58" y1="78" x2="70" y2="78" />
          <line x1="90" y1="78" x2="102" y2="78" />
        </g>
      ) : (
        <g fill="#FF85A1">
          <circle cx="64" cy="78" r="4.5" />
          <circle cx="96" cy="78" r="4.5" />
        </g>
      )}
      <path d={isDegraded ? 'M74 102 Q80 97 86 102' : 'M73 98 Q76.5 103 80 98 Q83.5 103 87 98'} fill="none" stroke="#3D3135" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="34" y1="88" x2="46" y2="90" stroke="#FF85A1" strokeWidth="2" strokeLinecap="round" />
      <line x1="114" y1="90" x2="126" y2="88" stroke="#FF85A1" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
};

/* 3. MYTHICAL */
const MythicalDragonVector: React.FC<{
  state: MascotHealthState;
  focusActivity: FocusMascotActivity | null;
}> = ({ state, focusActivity }) => {
  const isFlourishing = state === 'flourishing';
  const isDegraded = state === 'degraded';

  return (
    <g>
      <path d={isDegraded ? 'M42 84 Q18 92 24 112 Q36 106 46 104' : 'M44 76 Q14 54 22 86 Q32 82 44 92'} fill="#C084FC" stroke="#9333EA" strokeWidth="2.5" />
      <path d={isDegraded ? 'M118 84 Q142 92 136 112 Q124 106 114 104' : 'M116 76 Q146 54 138 86 Q128 82 116 92'} fill="#C084FC" stroke="#9333EA" strokeWidth="2.5" />
      <path d="M58 46 L50 26 L68 42 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
      <path d="M102 46 L110 26 L92 42 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
      <ellipse cx="80" cy="86" rx="38" ry="42" fill={isDegraded ? '#D6C7D9' : '#FFB3C6'} stroke="#FF85A1" strokeWidth="3" />
      <ellipse cx="80" cy="96" rx="24" ry="26" fill="#FFF5F7" />
      {focusActivity === 'sleeping' || focusActivity === 'meditating' ? (
        <g stroke="#3D3135" strokeWidth="2.5" fill="none" strokeLinecap="round">
          <path d="M62 66 Q67 71 72 66" />
          <path d="M88 66 Q93 71 98 66" />
        </g>
      ) : isDegraded ? (
        <g stroke="#3D3135" strokeWidth="2.5" fill="none" strokeLinecap="round">
          <path d="M62 68 L70 64" />
          <path d="M98 68 L90 64" />
        </g>
      ) : (
        <g>
          <circle cx="66" cy="66" r="4" fill="#3D3135" />
          <circle cx="94" cy="66" r="4" fill="#3D3135" />
        </g>
      )}
      {isFlourishing && !focusActivity && (
        <path d="M80 76 Q96 70 106 76 Q96 84 80 76 Z" fill="#FBBF24" stroke="#F97316" strokeWidth="1.5" />
      )}
    </g>
  );
};

/* 4. MECHANICAL */
const MechanicalBotVector: React.FC<{
  state: MascotHealthState;
  focusActivity: FocusMascotActivity | null;
}> = ({ state, focusActivity }) => {
  const isFlourishing = state === 'flourishing';
  const isDegraded = state === 'degraded';

  return (
    <g>
      <line x1="80" y1="44" x2={isDegraded ? '92' : '80'} y2="24" stroke="#3D3135" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx={isDegraded ? '92' : '80'} cy="22" r="6" fill={isFlourishing ? '#34D399' : isDegraded ? '#EF4444' : '#FF85A1'} />
      <rect x="38" y="44" width="84" height="74" rx="18" fill={isDegraded ? '#D6D3D1' : '#FFFFFF'} stroke={isDegraded ? '#78716C' : '#FF85A1'} strokeWidth="3.5" />
      {isDegraded && (
        <g fill="#B45309" opacity="0.55">
          <circle cx="48" cy="54" r="6" />
          <circle cx="110" cy="106" r="8" />
        </g>
      )}
      <rect x="48" y="54" width="64" height="42" rx="10" fill="#1F191C" stroke={isFlourishing ? '#34D399' : isDegraded ? '#EF4444' : '#FFA6C1'} strokeWidth="2" />
      {focusActivity === 'sleeping' || focusActivity === 'meditating' ? (
        <text x="64" y="80" fill="#FFA6C1" fontSize="14" fontFamily="monospace" fontWeight="700">
          - _ -
        </text>
      ) : isFlourishing ? (
        <text x="61" y="80" fill="#34D399" fontSize="15" fontFamily="monospace" fontWeight="700">
          ^ ω ^
        </text>
      ) : isDegraded ? (
        <text x="63" y="80" fill="#EF4444" fontSize="15" fontFamily="monospace" fontWeight="700">
          × _ ×
        </text>
      ) : (
        <text x="63" y="80" fill="#FF85A1" fontSize="15" fontFamily="monospace" fontWeight="700">
          • ‿ •
        </text>
      )}
      <rect x="58" y="103" width="44" height="8" rx="4" fill="#F3E8EE" />
      <rect x="58" y="103" width={isFlourishing ? '44' : isDegraded ? '12' : '28'} height="8" rx="4" fill={isFlourishing ? '#34D399' : isDegraded ? '#EF4444' : '#FF85A1'} />
    </g>
  );
};

/* 5. CHIHUAHUA */
const ChihuahuaVector: React.FC<{
  state: MascotHealthState;
  focusActivity: FocusMascotActivity | null;
}> = ({ state, focusActivity }) => {
  const isFlourishing = state === 'flourishing';
  const isDegraded = state === 'degraded';
  const furColor = isDegraded ? '#D8CCB8' : isFlourishing ? '#FCD34D' : '#FDE68A';

  return (
    <g>
      {/* Giant Chihuahua Ears */}
      <polygon
        points={isDegraded ? '28,68 36,18 70,52' : '24,58 32,10 68,46'}
        fill={furColor}
        stroke="#D97706"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <polygon
        points={isDegraded ? '28,64 36,24 62,50' : '26,54 34,18 60,44'}
        fill="#FBCFE8"
      />

      <polygon
        points={isDegraded ? '132,68 124,18 90,52' : '136,58 128,10 92,46'}
        fill={furColor}
        stroke="#D97706"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <polygon
        points={isDegraded ? '132,64 124,24 98,50' : '134,54 126,18 100,44'}
        fill="#FBCFE8"
      />

      {/* Round Apple Head */}
      <ellipse cx="80" cy="74" rx="38" ry="34" fill={furColor} stroke="#D97706" strokeWidth="2.5" />

      {/* Tiny Body */}
      <path
        d="M56 102 Q50 134 64 138 L96 138 Q110 134 104 102 Z"
        fill={furColor}
        stroke="#D97706"
        strokeWidth="2.5"
      />

      {/* Collar with Little Bell */}
      <path d="M52 102 Q80 114 108 102" stroke="#FF85A1" strokeWidth="5" strokeLinecap="round" />
      <circle cx="80" cy="112" r="5" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />

      {/* Eyes */}
      {focusActivity === 'sleeping' || focusActivity === 'meditating' ? (
        <g stroke="#3D3135" strokeWidth="2.5" fill="none" strokeLinecap="round">
          <path d="M58 72 Q66 78 74 72" />
          <path d="M86 72 Q94 78 102 72" />
        </g>
      ) : isDegraded ? (
        <g>
          {/* Shivering sad eyes with tear */}
          <ellipse cx="66" cy="72" rx="6" ry="7" fill="#3D3135" />
          <ellipse cx="94" cy="72" rx="6" ry="7" fill="#3D3135" />
          <circle cx="64" cy="70" r="2.5" fill="#FFFFFF" />
          <circle cx="92" cy="70" r="2.5" fill="#FFFFFF" />
          <path d="M102 76 Q108 86 104 92 Q98 86 102 76 Z" fill="#60A5FA" />
        </g>
      ) : (
        <g>
          {/* Huge Glossy Puppy Eyes */}
          <ellipse cx="66" cy="70" rx="7" ry="8" fill="#3D3135" />
          <ellipse cx="94" cy="70" rx="7" ry="8" fill="#3D3135" />
          <circle cx="64" cy="67" r="3" fill="#FFFFFF" />
          <circle cx="92" cy="67" r="3" fill="#FFFFFF" />
          <circle cx="68" cy="73" r="1.5" fill="#FFFFFF" />
          <circle cx="96" cy="73" r="1.5" fill="#FFFFFF" />
        </g>
      )}

      {/* Snout & Nose */}
      <ellipse cx="80" cy="84" rx="4" ry="3" fill="#3D3135" />
      <path
        d={isDegraded ? 'M75 92 Q80 88 85 92' : 'M74 88 Q77 92 80 88 Q83 92 86 88'}
        fill="none"
        stroke="#3D3135"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Happy Bouncing Tail when flourishing */}
      {isFlourishing && (
        <path
          d="M104 126 Q128 120 126 102"
          fill="none"
          stroke="#D97706"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      )}
    </g>
  );
};

/* 6. GERMAN SHEPHERD */
const GermanShepherdVector: React.FC<{
  state: MascotHealthState;
  focusActivity: FocusMascotActivity | null;
}> = ({ state, focusActivity }) => {
  const isFlourishing = state === 'flourishing';
  const isDegraded = state === 'degraded';

  return (
    <g>
      {/* Tall Shepherd Ears */}
      <polygon
        points={isDegraded ? '38,62 46,12 74,48' : '36,54 44,4 72,40'}
        fill="#3D2B1F"
        stroke="#271B14"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <polygon points="42,50 48,16 66,42" fill="#D97706" />

      <polygon
        points={isDegraded ? '122,62 114,12 86,48' : '124,54 116,4 88,40'}
        fill="#3D2B1F"
        stroke="#271B14"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <polygon points="118,50 112,16 94,42" fill="#D97706" />

      {/* Head with Tan & Black Mask */}
      <path
        d="M48 60 Q80 44 112 60 Q118 92 104 106 L56 106 Q42 92 48 60 Z"
        fill="#F59E0B"
        stroke="#B45309"
        strokeWidth="2.5"
      />
      {/* Black Mask Overlay */}
      <path
        d="M60 56 Q80 48 100 56 Q106 82 80 94 Q54 82 60 56 Z"
        fill="#3D2B1F"
      />

      {/* Noble Body & Bandana */}
      <path
        d="M52 106 L108 106 L102 138 L58 138 Z"
        fill="#D97706"
        stroke="#B45309"
        strokeWidth="2.5"
      />
      <polygon
        points="50,106 110,106 80,128"
        fill="#EF4444"
        stroke="#B91C1C"
        strokeWidth="2"
      />

      {/* Gold Champion Medal when Flourishing */}
      {isFlourishing && (
        <circle cx="80" cy="128" r="6" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />
      )}

      {/* Eyes */}
      {focusActivity === 'sleeping' || focusActivity === 'meditating' ? (
        <g stroke="#F59E0B" strokeWidth="2.5" fill="none" strokeLinecap="round">
          <path d="M64 70 Q70 75 76 70" />
          <path d="M84 70 Q90 75 96 70" />
        </g>
      ) : isDegraded ? (
        <g stroke="#9CA3AF" strokeWidth="2.5" fill="none" strokeLinecap="round">
          <line x1="64" y1="72" x2="74" y2="72" />
          <line x1="86" y1="72" x2="96" y2="72" />
        </g>
      ) : (
        <g fill="#F59E0B">
          <circle cx="70" cy="68" r="4.5" />
          <circle cx="90" cy="68" r="4.5" />
          <circle cx="69" cy="66" r="1.8" fill="#FFFFFF" />
          <circle cx="89" cy="66" r="1.8" fill="#FFFFFF" />
        </g>
      )}

      {/* Shepherd Snout */}
      <ellipse cx="80" cy="86" rx="5" ry="3.5" fill="#1F191C" />
      {isFlourishing ? (
        // Happy Tongue Out
        <g>
          <path d="M76 90 Q80 94 84 90" stroke="#1F191C" strokeWidth="2" fill="none" />
          <path d="M78 92 Q80 102 82 92 Z" fill="#F43F5E" />
        </g>
      ) : (
        <path d="M75 90 Q80 94 85 90" stroke="#1F191C" strokeWidth="2" fill="none" strokeLinecap="round" />
      )}
    </g>
  );
};

/* 7. CUPCAKE */
const CupcakeVector: React.FC<{
  state: MascotHealthState;
  focusActivity: FocusMascotActivity | null;
}> = ({ state, focusActivity }) => {
  const isFlourishing = state === 'flourishing';
  const isDegraded = state === 'degraded';
  const frostingColor = isDegraded ? '#D8CBD1' : '#FFA6C1';

  return (
    <g>
      {/* Ribbed Baking Cup */}
      <path
        d="M48 94 L112 94 L102 138 C101 140 98 142 94 142 L66 142 C62 142 59 140 58 138 Z"
        fill={isDegraded ? '#C4B5A5' : '#FFF0F5'}
        stroke="#FF85A1"
        strokeWidth="3"
      />
      {/* Cup Rib Lines */}
      <line x1="62" y1="94" x2="68" y2="142" stroke="#FF85A1" strokeWidth="1.8" strokeDasharray="3 3" />
      <line x1="80" y1="94" x2="80" y2="142" stroke="#FF85A1" strokeWidth="1.8" strokeDasharray="3 3" />
      <line x1="98" y1="94" x2="92" y2="142" stroke="#FF85A1" strokeWidth="1.8" strokeDasharray="3 3" />

      {/* Fluffy Swirl Frosting */}
      <g transform={isDegraded ? 'translate(6, 6) rotate(6 80 70)' : ''}>
        {/* Bottom Tier */}
        <path
          d="M38 96 Q44 76 64 78 Q80 66 96 78 Q116 76 122 96 Q80 106 38 96 Z"
          fill={frostingColor}
          stroke="#FF85A1"
          strokeWidth="3"
        />
        {/* Top Swirl */}
        <path
          d="M52 78 Q60 52 80 50 Q100 52 108 78 Q80 68 52 78 Z"
          fill={isDegraded ? '#B8A8B0' : '#FFD6E0'}
          stroke="#FF85A1"
          strokeWidth="2.5"
        />
        {/* Swirl Crown */}
        <path
          d="M70 54 Q80 34 88 54 Q80 46 70 54 Z"
          fill={isDegraded ? '#9CA3AF' : '#FFF5F7'}
        />

        {/* Glossy Cherry on Top */}
        <circle
          cx="80"
          cy="32"
          r="8"
          fill={isDegraded ? '#78350F' : '#E11D48'}
          stroke={isDegraded ? '#451A03' : '#9F1239'}
          strokeWidth="2"
        />
        <path d="M80 24 Q92 14 90 6" fill="none" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
        {!isDegraded && <circle cx="78" cy="30" r="2.5" fill="#FFFFFF" />}

        {/* Sprinkles */}
        {!isDegraded && (
          <g>
            <rect x="54" y="82" width="6" height="2.5" rx="1" fill="#3B82F6" transform="rotate(25 54 82)" />
            <rect x="100" y="82" width="6" height="2.5" rx="1" fill="#10B981" transform="rotate(-30 100 82)" />
            <rect x="74" y="66" width="6" height="2.5" rx="1" fill="#FBBF24" transform="rotate(45 74 66)" />
            <rect x="86" y="68" width="6" height="2.5" rx="1" fill="#A855F7" transform="rotate(-15 86 68)" />
          </g>
        )}
      </g>

      {/* Face on Cup */}
      {focusActivity === 'sleeping' || focusActivity === 'meditating' ? (
        <g stroke="#3D3135" strokeWidth="2.2" fill="none" strokeLinecap="round">
          <path d="M66 114 Q70 118 74 114" />
          <path d="M86 114 Q90 118 94 114" />
          <path d="M77 122 Q80 125 83 122" />
        </g>
      ) : isDegraded ? (
        <g stroke="#3D3135" strokeWidth="2.2" fill="none" strokeLinecap="round">
          <path d="M66 112 L72 118 M72 112 L66 118" />
          <path d="M88 112 L94 118 M94 112 L88 118" />
          <path d="M76 128 Q80 122 84 128" />
        </g>
      ) : (
        <g>
          <circle cx="70" cy="116" r="3" fill="#3D3135" />
          <circle cx="90" cy="116" r="3" fill="#3D3135" />
          <ellipse cx="64" cy="120" rx="4" ry="2.5" fill="#FF85A1" opacity="0.6" />
          <ellipse cx="96" cy="120" rx="4" ry="2.5" fill="#FF85A1" opacity="0.6" />
          <path d={isFlourishing ? 'M75 120 Q80 128 85 120' : 'M76 122 Q80 125 84 122'} fill="none" stroke="#3D3135" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      )}
    </g>
  );
};

/* 8. CAPYBARA */
const CapybaraVector: React.FC<{
  state: MascotHealthState;
  focusActivity: FocusMascotActivity | null;
}> = ({ state, focusActivity }) => {
  const isFlourishing = state === 'flourishing';
  const isDegraded = state === 'degraded';
  const furColor = isDegraded ? '#A89988' : '#C28452';

  return (
    <g>
      {/* Onsen Bath Tub when flourishing */}
      {isFlourishing && (
        <g>
          {/* Steam Swirls */}
          <path d="M46 36 Q50 20 54 36" fill="none" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
          <path d="M106 36 Q110 20 114 36" fill="none" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
          {/* Wooden Tub rim */}
          <ellipse cx="80" cy="136" rx="48" ry="12" fill="#E5D5C5" stroke="#8C6D58" strokeWidth="3" />
        </g>
      )}

      {/* Tiny Rounded Capybara Ears */}
      <circle cx="48" cy="56" r="7" fill={furColor} stroke="#8C5832" strokeWidth="2" />
      <circle cx="48" cy="56" r="4" fill="#E5B288" />
      <circle cx="112" cy="56" r="7" fill={furColor} stroke="#8C5832" strokeWidth="2" />
      <circle cx="112" cy="56" r="4" fill="#E5B288" />

      {/* Blocky Relaxed Head & Snout */}
      <rect
        x="44"
        y="52"
        width="72"
        height="64"
        rx="26"
        fill={furColor}
        stroke="#8C5832"
        strokeWidth="3"
      />
      {/* Dark Snout Patch */}
      <path
        d="M60 88 Q80 84 100 88 L96 112 Q80 116 64 112 Z"
        fill="#784723"
        stroke="#593116"
        strokeWidth="2"
      />

      {/* Nostrils */}
      <circle cx="74" cy="98" r="2.2" fill="#2E1708" />
      <circle cx="86" cy="98" r="2.2" fill="#2E1708" />

      {/* Iconic Orange / Yuzu on Head */}
      <g transform={isDegraded ? 'translate(8, 4) rotate(18 80 44)' : ''}>
        <circle cx="80" cy="44" r="9" fill={isDegraded ? '#785A28' : '#F97316'} stroke="#C2410C" strokeWidth="1.8" />
        <path d="M80 35 Q84 30 82 27" fill="none" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="84" cy="30" rx="3" ry="1.5" fill="#22C55E" />
      </g>

      {/* Peaceful Closed Capybara Eyes */}
      {isDegraded ? (
        <g stroke="#3D2010" strokeWidth="2.5" fill="none" strokeLinecap="round">
          <line x1="56" y1="72" x2="68" y2="76" />
          <line x1="104" y1="72" x2="92" y2="76" />
        </g>
      ) : (
        <g stroke="#3D2010" strokeWidth="2.5" fill="none" strokeLinecap="round">
          <path d="M58 72 Q64 77 70 72" />
          <path d="M90 72 Q96 77 102 72" />
        </g>
      )}

      {/* Calm Little Body */}
      <path
        d="M40 114 Q32 140 50 142 L110 142 Q128 140 120 114 Z"
        fill={furColor}
        stroke="#8C5832"
        strokeWidth="3"
      />
    </g>
  );
};

/* 9. PICKLE */
const PickleVector: React.FC<{
  state: MascotHealthState;
  focusActivity: FocusMascotActivity | null;
}> = ({ state, focusActivity }) => {
  const isFlourishing = state === 'flourishing';
  const isDegraded = state === 'degraded';
  const pickleColor = isDegraded ? '#8B9467' : isFlourishing ? '#22C55E' : '#4ADE80';
  const bumpColor = isDegraded ? '#656D4A' : '#15803D';

  return (
    <g>
      {/* Pickle Body */}
      <path
        d={
          isDegraded
            ? 'M62 36 Q86 28 98 42 Q108 84 92 128 Q72 146 58 132 Q52 92 62 36 Z'
            : 'M58 38 Q80 26 102 38 Q112 82 100 132 Q78 146 60 132 Q48 86 58 38 Z'
        }
        fill={pickleColor}
        stroke="#166534"
        strokeWidth="3.2"
      />

      {/* Texture Bumps / Warts */}
      <ellipse cx="68" cy="52" rx="4" ry="2.5" fill={bumpColor} opacity="0.6" />
      <ellipse cx="92" cy="62" rx="4" ry="2.5" fill={bumpColor} opacity="0.6" />
      <ellipse cx="72" cy="88" rx="4.5" ry="3" fill={bumpColor} opacity="0.6" />
      <ellipse cx="88" cy="106" rx="4" ry="2.5" fill={bumpColor} opacity="0.6" />
      <ellipse cx="64" cy="118" rx="3.5" ry="2" fill={bumpColor} opacity="0.6" />

      {/* Cute Bowtie */}
      <polygon points="72,126 88,126 80,122" fill="#EF4444" />
      <polygon points="72,126 88,126 80,130" fill="#EF4444" />
      <circle cx="80" cy="126" r="2" fill="#FDE047" />

      {/* Cool Sunglasses when Flourishing */}
      {isFlourishing && !focusActivity ? (
        <g>
          <rect x="58" y="62" width="18" height="12" rx="3" fill="#18181B" stroke="#000000" strokeWidth="1.5" />
          <rect x="84" y="62" width="18" height="12" rx="3" fill="#18181B" stroke="#000000" strokeWidth="1.5" />
          <line x1="76" y1="68" x2="84" y2="68" stroke="#000000" strokeWidth="2" />
          {/* Glare */}
          <line x1="60" y1="64" x2="66" y2="72" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="86" y1="64" x2="92" y2="72" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M74 84 Q80 92 86 84" fill="none" stroke="#14532D" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      ) : focusActivity === 'sleeping' || focusActivity === 'meditating' ? (
        <g stroke="#14532D" strokeWidth="2.5" fill="none" strokeLinecap="round">
          <path d="M66 68 Q72 73 78 68" />
          <path d="M82 68 Q88 73 94 68" />
          <path d="M77 82 Q80 85 83 82" />
        </g>
      ) : isDegraded ? (
        <g stroke="#14532D" strokeWidth="2.5" fill="none" strokeLinecap="round">
          <path d="M66 66 L74 74 M74 66 L66 74" />
          <path d="M86 66 L94 74 M94 66 L86 74" />
          <path d="M74 86 Q80 80 86 86" />
        </g>
      ) : (
        <g>
          <circle cx="70" cy="70" r="3.5" fill="#14532D" />
          <circle cx="90" cy="70" r="3.5" fill="#14532D" />
          <ellipse cx="64" cy="74" rx="3.5" ry="2" fill="#FF85A1" opacity="0.6" />
          <ellipse cx="96" cy="74" rx="3.5" ry="2" fill="#FF85A1" opacity="0.6" />
          <path d="M74 80 Q80 86 86 80" fill="none" stroke="#14532D" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}
    </g>
  );
};
