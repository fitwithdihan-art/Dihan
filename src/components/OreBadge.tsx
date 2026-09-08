import React from 'react';
import { Sparkles } from 'lucide-react';

export type OreBadgeTier = 'copper' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'red_diamond' | 'cosmic_obsidian';

interface OreBadgeProps {
  tier: OreBadgeTier;
  level?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const OreBadge: React.FC<OreBadgeProps> = ({ tier, level, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-36 h-36',
  };

  // Define gradients & styles based on ore tier
  const tierConfig = {
    copper: {
      name: 'Copper',
      bgGrad: '#d97706', // orange-600
      borderGrad: '#f97316', // orange-500
      glowColor: 'rgba(217, 119, 6, 0.35)',
      textCol: 'text-orange-100',
      symbol: '🪵',
    },
    bronze: {
      name: 'Bronze',
      bgGrad: '#92400e', // amber-800
      borderGrad: '#d97706', // amber-600
      glowColor: 'rgba(180, 83, 9, 0.4)',
      textCol: 'text-amber-100',
      symbol: '🛡️',
    },
    silver: {
      name: 'Silver',
      bgGrad: '#64748b', // slate-500
      borderGrad: '#cbd5e1', // slate-300
      glowColor: 'rgba(226, 232, 240, 0.45)',
      textCol: 'text-slate-100 font-bold',
      symbol: '⚔️',
    },
    gold: {
      name: 'Gold',
      bgGrad: '#d97706', // amber-600
      borderGrad: '#facc15', // yellow-400
      glowColor: 'rgba(251, 191, 36, 0.5)',
      textCol: 'text-yellow-100 font-extrabold',
      symbol: '👑',
    },
    platinum: {
      name: 'Platinum',
      bgGrad: '#0891b2', // cyan-600
      borderGrad: '#22d3ee', // cyan-400
      glowColor: 'rgba(34, 211, 238, 0.55)',
      textCol: 'text-cyan-100 font-black',
      symbol: '⚡',
    },
    diamond: {
      name: 'Diamond',
      bgGrad: '#0891b2', // cyan-600
      borderGrad: '#00ffff', // pure cyan
      glowColor: 'rgba(0, 255, 255, 0.75)',
      textCol: 'text-cyan-100 font-black',
      symbol: '💎',
    },
    red_diamond: {
      name: 'Red Diamond',
      bgGrad: '#e11d48', // rose-600
      borderGrad: '#fda4af', // rose-300
      glowColor: 'rgba(244, 63, 94, 0.75)',
      textCol: 'text-rose-100 font-black animate-pulse',
      symbol: '🩸',
    },
    cosmic_obsidian: {
      name: 'Cosmic Obsidian',
      bgGrad: '#581c87', // purple-900
      borderGrad: '#c084fc', // purple-400
      glowColor: 'rgba(168, 85, 247, 0.9)',
      textCol: 'text-purple-100 font-black tracking-widest',
      symbol: '🌌',
    },
  };

  const config = tierConfig[tier] || tierConfig.copper;

  return (
    <div
      className={`relative select-none flex items-center justify-center ${sizeClasses[size]} ${className}`}
      style={{
        filter: `drop-shadow(0 0 10px ${config.glowColor})`,
      }}
    >
      {/* 3D Shield/Gem SVG Vector Asset */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full transform transition hover:scale-105 active:scale-95 duration-300"
      >
        <defs>
          {/* Main Ore Metallic Shield Gradient */}
          <linearGradient id={`bgGrad-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: config.bgGrad }} />
            <stop offset="100%" style={{ stopColor: '#1c1917' }} />
          </linearGradient>

          {/* Border Gradient */}
          <linearGradient id={`borderGrad-${tier}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: config.borderGrad }} />
            <stop offset="100%" style={{ stopColor: config.bgGrad }} />
          </linearGradient>

          {/* Internal facet reflection */}
          <linearGradient id="facetReflect" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.4 }} />
            <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 0 }} />
          </linearGradient>
        </defs>

        {/* Outer Shield Base Shadow */}
        <path
          d="M 50 4 L 88 22 L 88 56 C 88 74 68 88 50 94 C 32 88 12 74 12 56 L 12 22 Z"
          fill="#0c0a09"
          opacity="0.6"
        />

        {/* Outer Shield Core Ring */}
        <path
          d="M 50 6 L 86 24 L 86 56 C 86 72 67 86 50 92 C 33 86 14 72 14 56 L 14 24 Z"
          fill={`url(#borderGrad-${tier})`}
        />

        {/* Inner Shield (Recessed Plate) */}
        <path
          d="M 50 12 L 80 27 L 80 54 C 80 67 65 79 50 85 C 35 79 20 67 20 54 L 20 27 Z"
          fill={`url(#bgGrad-${tier})`}
        />

        {/* Facet Reflection Lines (Emphasizes Ore Cut & Metallic Look) */}
        <path
          d="M 50 12 L 80 27 L 50 50 Z"
          fill="url(#facetReflect)"
          opacity="0.3"
        />
        <path
          d="M 50 12 L 20 27 L 50 50 Z"
          fill="url(#facetReflect)"
          opacity="0.15"
        />

        {/* Internal Gemstone / Ore Prism Cuts */}
        {tier === 'diamond' || tier === 'red_diamond' || tier === 'cosmic_obsidian' ? (
          <g opacity="0.4">
            <line x1="50" y1="12" x2="50" y2="85" stroke="#ffffff" strokeWidth="1" />
            <line x1="20" y1="27" x2="80" y2="54" stroke="#ffffff" strokeWidth="0.5" />
            <line x1="80" y1="27" x2="20" y2="54" stroke="#ffffff" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="15" fill="none" stroke="#ffffff" strokeWidth="0.75" strokeDasharray="3 3" />
          </g>
        ) : (
          <g opacity="0.25">
            <line x1="50" y1="12" x2="50" y2="85" stroke="#000000" strokeWidth="1.5" />
            <line x1="20" y1="27" x2="80" y2="27" stroke="#000000" strokeWidth="1" />
          </g>
        )}

        {/* Highlight point */}
        <circle cx="50" cy="22" r="2" fill="#ffffff" opacity="0.9" />
      </svg>

      {/* Symbol & Level Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-0.5 sm:-mt-1">
        <span className="text-base sm:text-lg leading-none filter drop-shadow-md mb-1 animate-pulse">
          {config.symbol}
        </span>
        {level !== undefined && (
          <span className={`font-mono font-black text-[13px] sm:text-[15px] leading-none tracking-tight filter drop-shadow-md ${config.textCol}`}>
            {level}
          </span>
        )}
      </div>

      {/* Sparkles on Diamond+ tiers */}
      {(tier === 'diamond' || tier === 'red_diamond' || tier === 'cosmic_obsidian') && (
        <div className="absolute top-1 right-1 animate-ping">
          <Sparkles className="w-3.5 h-3.5 text-white opacity-85" />
        </div>
      )}
    </div>
  );
};
