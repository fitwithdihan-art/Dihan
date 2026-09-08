import React from 'react';
import { BadgeTier, TIER_CONFIG } from '../utils/rankService';
import { Award, Crown, Flame, Sparkles, Trophy } from 'lucide-react';

interface RankBadgeProps {
  rankTitle: string;
  tier?: BadgeTier | string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
  title?: string;
  onClick?: () => void;
}

export const RankBadge: React.FC<RankBadgeProps> = ({
  rankTitle,
  tier,
  size = 'sm',
  showIcon = true,
  className = '',
  title,
  onClick,
}) => {
  // Infer tier if not strictly matching or not provided
  let resolvedTier: BadgeTier = 'copper';
  if (tier && tier in TIER_CONFIG) {
    resolvedTier = tier as BadgeTier;
  } else {
    const lower = (rankTitle || '').toLowerCase();
    if (lower.includes('cosmic') || lower.includes('obsidian') || lower.includes('legend')) {
      resolvedTier = 'cosmic_obsidian';
    } else if (lower.includes('red') || lower.includes('champion') || lower.includes('grandmaster')) {
      resolvedTier = 'red_diamond';
    } else if (lower.includes('diamond') || lower.includes('master')) {
      resolvedTier = 'diamond';
    } else if (lower.includes('platinum') || lower.includes('elite')) {
      resolvedTier = 'platinum';
    } else if (lower.includes('gold') || lower.includes('adept') || lower.includes('skilled')) {
      resolvedTier = 'gold';
    } else if (lower.includes('silver') || lower.includes('practitioner')) {
      resolvedTier = 'silver';
    } else if (lower.includes('bronze') || lower.includes('apprentice')) {
      resolvedTier = 'bronze';
    } else {
      resolvedTier = 'copper';
    }
  }

  const config = TIER_CONFIG[resolvedTier] || TIER_CONFIG.copper;

  const sizeClasses = {
    xs: 'text-[9px] px-2 py-0.5 gap-1 rounded-md border',
    sm: 'text-[11px] px-2.5 py-1 gap-1.5 rounded-lg border',
    md: 'text-xs px-3 py-1.5 gap-2 rounded-xl border',
    lg: 'text-sm px-4 py-2 gap-2.5 rounded-2xl border-2',
  }[size];

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  const getTierIcon = () => {
    switch (resolvedTier) {
      case 'cosmic_obsidian':
        return <Crown className={`${iconSizes} text-purple-300 fill-purple-400/20`} />;
      case 'red_diamond':
        return <Trophy className={`${iconSizes} text-rose-400 fill-rose-500/20`} />;
      case 'diamond':
        return <Sparkles className={`${iconSizes} text-sky-300 animate-pulse`} />;
      case 'platinum':
        return <Award className={`${iconSizes} text-cyan-300`} />;
      case 'gold':
        return <Trophy className={`${iconSizes} text-yellow-400`} />;
      case 'silver':
        return <Award className={`${iconSizes} text-slate-300`} />;
      case 'bronze':
        return <Flame className={`${iconSizes} text-amber-500`} />;
      default:
        return <Award className={`${iconSizes} text-amber-600`} />;
    }
  };

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`inline-flex items-center font-mono font-bold tracking-tight shadow-sm transition-all select-none backdrop-blur-sm ${
        config.bgClass
      } ${config.textClass} ${config.borderClass} ${config.shadowClass} ${sizeClasses} ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
      } ${className}`}
      title={title || `${rankTitle} (${config.name} Tier)`}
    >
      {showIcon && <span className="shrink-0 flex items-center">{getTierIcon()}</span>}
      <span className="truncate whitespace-nowrap">{rankTitle}</span>
    </Component>
  );
};
