import React, { useState, useRef } from 'react';
import { Dumbbell, Compass, History, Trophy, Flame, Play, Coins, User, Camera, UploadCloud, X, Users, UserPlus, Sparkles, Award, Check, Calculator, Calendar } from 'lucide-react';
import { AppData } from '../types';
import { BadgeTier, getActiveBestRank, getEarnedRanks, TIER_CONFIG } from '../utils/rankService';
import { RankBadge } from './RankBadge';

export type ActiveTab = 'routines' | 'progressions' | 'calendar' | 'ranks' | 'history' | 'prs' | 'calculator' | 'friends';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  hasActiveWorkout: boolean;
  onResumeWorkout: () => void;
  activeWorkoutTitle?: string;
  coins?: number;
  onOpenShop?: () => void;
  athleteName: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
  bestRank?: string;
  bestRankTier?: BadgeTier;
  appData?: AppData;
  onUpdateProfile: (
    name: string,
    username: string,
    avatarUrl: string,
    bio?: string,
    bestRank?: string,
    bestRankTier?: BadgeTier
  ) => void;
  friendsCount?: number;
  onOpenInvite?: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=150&auto=format&fit=crop&q=60', // Iron Gym
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=150&auto=format&fit=crop&q=60', // Calisthenics Ring
  'https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?w=150&auto=format&fit=crop&q=60', // Beast Mode
  'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=150&q=80', // Barbells
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  hasActiveWorkout,
  onResumeWorkout,
  activeWorkoutTitle,
  coins = 0,
  onOpenShop,
  athleteName,
  username = 'cali_beast',
  avatarUrl = '',
  bio = '',
  bestRank = '',
  bestRankTier,
  appData,
  onUpdateProfile,
  friendsCount = 0,
  onOpenInvite,
}) => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>(athleteName);
  const [tempUsername, setTempUsername] = useState<string>(username);
  const [tempAvatar, setTempAvatar] = useState<string>(avatarUrl);
  const [tempBio, setTempBio] = useState<string>(bio);
  const [tempBestRank, setTempBestRank] = useState<string>(bestRank);
  const [tempBestRankTier, setTempBestRankTier] = useState<BadgeTier>(bestRankTier || 'copper');
  const [isCustomRank, setIsCustomRank] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute calculated earned ranks
  const computedActiveRank = appData
    ? getActiveBestRank(appData)
    : { title: 'Bar Apprentice', tier: 'copper' as BadgeTier };
  const earnedRanks = appData ? getEarnedRanks(appData) : [];

  // Effective rank for navbar display
  const currentNavRank = bestRank || computedActiveRank.title;
  const currentNavTier = bestRankTier || computedActiveRank.tier;

  // Sync state when opening
  const handleOpenProfileModal = () => {
    setTempName(athleteName);
    setTempUsername(username);
    setTempAvatar(avatarUrl);
    setTempBio(bio || '');
    setTempBestRank(bestRank || computedActiveRank.title);
    setTempBestRankTier(bestRankTier || computedActiveRank.tier);
    setIsCustomRank(false);
    setIsProfileModalOpen(true);
  };

  // Convert uploaded image to Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setTempAvatar(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(
      tempName.trim() || 'Calisthenics Athlete',
      tempUsername.trim().toLowerCase().replace(/\s+/g, '_') || 'athlete',
      tempAvatar,
      tempBio.trim(),
      tempBestRank.trim() || computedActiveRank.title,
      tempBestRankTier
    );
    setIsProfileModalOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
        {/* Active Workout Resume Top Banner */}
        {hasActiveWorkout && (
          <div
            id="active-workout-global-banner"
            onClick={onResumeWorkout}
            className="bg-orange-500 hover:bg-orange-400 text-zinc-950 px-4 py-2.5 text-xs font-bold flex items-center justify-between cursor-pointer transition shadow-md"
          >
            <div className="flex items-center gap-2 max-w-md truncate">
              <span className="w-2 h-2 rounded-full bg-zinc-950 animate-ping" />
              <span className="uppercase tracking-wider font-mono">Workout in progress:</span>
              <span className="font-extrabold truncate">{activeWorkoutTitle || 'Current Session'}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0 font-mono text-[11px] underline">
              <Play className="w-3 h-3 fill-current" />
              <span>Tap to Resume</span>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Brand Logo */}
            <div
              className="flex items-center gap-2.5 cursor-pointer select-none"
              onClick={() => onSelectTab('routines')}
            >
              <div className="w-9 h-9 rounded-xl bg-[#f97316] flex items-center justify-center text-zinc-950 shadow-md shadow-[#f97316]/30">
                <Flame className="w-5 h-5 fill-zinc-950 text-zinc-950" />
              </div>
              <div>
                <span className="text-base font-black tracking-tight text-white font-display">TEENTHENICS</span>
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#f97316] block -mt-1 font-bold">
                  Tracker & Skill Ladders
                </span>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-2">
              <button
                id="nav-tab-routines"
                onClick={() => onSelectTab('routines')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                  activeTab === 'routines'
                    ? 'bg-zinc-800 text-orange-400 shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Dumbbell className="w-4 h-4" />
                <span>Routines</span>
              </button>

              <button
                id="nav-tab-calendar"
                onClick={() => onSelectTab('calendar')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                  activeTab === 'calendar'
                    ? 'bg-zinc-800 text-orange-400 shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Calendar</span>
              </button>

              <button
                id="nav-tab-ranks"
                onClick={() => onSelectTab('ranks')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                  activeTab === 'ranks'
                    ? 'bg-zinc-800 text-orange-400 shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Ranks</span>
              </button>

              <button
                id="nav-tab-prs"
                onClick={() => onSelectTab('prs')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                  activeTab === 'prs'
                    ? 'bg-zinc-800 text-orange-400 shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>PRs & Stats</span>
              </button>

              <button
                id="nav-tab-calculator"
                onClick={() => onSelectTab('calculator')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                  activeTab === 'calculator'
                    ? 'bg-zinc-800 text-orange-400 shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Calculator className="w-4 h-4" />
                <span>Rank Calc</span>
              </button>

              <button
                id="nav-tab-friends"
                onClick={() => onSelectTab('friends')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                  activeTab === 'friends'
                    ? 'bg-zinc-800 text-orange-400 shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Friends</span>
                {friendsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-orange-500/20 text-orange-400 font-bold">
                    {friendsCount}
                  </span>
                )}
              </button>
            </nav>

            {/* Right Corner Buttons */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Invite Friends Button */}
              {onOpenInvite && (
                <button
                  id="nav-invite-friends-btn"
                  onClick={onOpenInvite}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/35 text-orange-400 text-xs font-black font-mono tracking-tight transition cursor-pointer select-none active:scale-95 duration-100"
                  title="Invite friends to squad"
                >
                  <UserPlus className="w-4 h-4 text-orange-400 shrink-0" />
                  <span className="hidden sm:inline">INVITE</span>
                </button>
              )}

              {/* Shop Trigger */}
              <button
                id="nav-coin-shop-btn"
                onClick={onOpenShop}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-400 text-xs font-black font-mono tracking-tight transition cursor-pointer select-none active:scale-95 duration-100"
                title="Open custom theme shop"
              >
                <Coins className="w-4.5 h-4.5 fill-amber-400 text-amber-400 animate-pulse shrink-0" />
                <span>
                  {coins} <span className="text-[9px] font-bold text-amber-500 hidden sm:inline">COINS</span>
                </span>
              </button>

              {/* Interactive Upper Right Profile Logo Widget */}
              <button
                id="nav-profile-widget-btn"
                onClick={handleOpenProfileModal}
                className="flex items-center gap-2 p-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-850/90 border border-zinc-800 hover:border-zinc-700 text-left transition select-none active:scale-95 duration-100 cursor-pointer"
                title="View & Customize Profile"
              >
                {tempAvatar || avatarUrl ? (
                  <img
                    src={tempAvatar || avatarUrl}
                    alt={athleteName}
                    className="w-7.5 h-7.5 rounded-lg object-cover border border-[#f97316]/20"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7.5 h-7.5 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-zinc-950 font-black font-mono text-[11px] uppercase shadow-inner">
                    {athleteName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:flex flex-col items-start leading-none pr-1 max-w-[110px]">
                  <span className="text-[11px] font-black text-white truncate w-full">{athleteName}</span>
                  <span className="text-[9px] font-mono font-bold text-zinc-500 mt-0.5 truncate w-full">
                    @{username}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Editor Dialog Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-orange-400" />
                <h3 className="text-base font-black text-white font-display tracking-tight">Athlete Profile & Bio</h3>
              </div>
              <button 
                onClick={() => setIsProfileModalOpen(false)} 
                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Profile Card Preview */}
            <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-2xl flex items-start gap-3 shadow-inner">
              {tempAvatar ? (
                <img
                  src={tempAvatar}
                  alt="Preview"
                  className="w-12 h-12 rounded-xl object-cover border border-zinc-700 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-orange-400 font-bold font-display text-base shrink-0">
                  {(tempName || 'A').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold text-white truncate">{tempName || 'Athlete'}</span>
                  <RankBadge
                    rankTitle={tempBestRank || computedActiveRank.title}
                    tier={tempBestRankTier}
                    size="xs"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 font-mono">@{tempUsername || 'athlete'}</p>
                <p className="text-[11px] text-zinc-300 italic line-clamp-2 bg-zinc-900/70 p-1.5 rounded-lg border border-zinc-800">
                  "{tempBio || 'No bio written yet. Tell your workout squad about your training style!'}"
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Profile Logo Upload Section */}
              <div className="flex flex-col items-center gap-3 bg-zinc-950/40 p-3.5 rounded-2xl border border-zinc-850">
                <div className="w-full flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
                    Profile Logo / Photo
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300 transition"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                  </button>
                </div>
                
                <div className="relative group">
                  {tempAvatar ? (
                    <img
                      src={tempAvatar}
                      alt="Preview logo"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-500/50"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-zinc-800 border-2 border-dashed border-zinc-700 flex items-center justify-center text-zinc-500">
                      <User className="w-7 h-7" />
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 p-1.5 bg-orange-500 hover:bg-orange-400 text-zinc-950 rounded-xl transition shadow-lg border border-zinc-900"
                    title="Upload Custom Image"
                  >
                    <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Preset Avatars Selection */}
                <div className="w-full pt-2 border-t border-zinc-800/60">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono block mb-1.5 text-center">
                    Or select Calisthenics Mascot
                  </span>
                  <div className="flex justify-center gap-2">
                    {PRESET_AVATARS.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setTempAvatar(url)}
                        className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition ${
                          tempAvatar === url ? 'border-orange-500 scale-105' : 'border-transparent hover:border-zinc-700'
                        }`}
                      >
                        <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setTempAvatar('')}
                      className={`w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-bold border-2 transition ${
                        !tempAvatar ? 'border-orange-500' : 'border-transparent'
                      }`}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              {/* Athlete Name Field */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider">
                  Athlete Name
                </label>
                <input
                  type="text"
                  required
                  maxLength={24}
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500 font-bold"
                  placeholder="e.g. Dihan Calispark"
                />
              </div>

              {/* Username Field */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-xs font-bold">@</span>
                  <input
                    type="text"
                    required
                    maxLength={18}
                    value={tempUsername}
                    onChange={(e) => setTempUsername(e.target.value)}
                    className="w-full pl-7 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono font-bold"
                    placeholder="calibeast"
                  />
                </div>
                <span className="text-[10px] text-zinc-500 block mt-0.5">Used by friends to search & connect</span>
              </div>

              {/* Profile Bio Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <span>Profile Bio</span>
                    <span className="text-[10px] font-normal text-zinc-500 lowercase">(public to friends)</span>
                  </label>
                  <span className={`text-[10px] font-mono ${tempBio.length > 140 ? 'text-amber-400' : 'text-zinc-500'}`}>
                    {tempBio.length}/160
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={160}
                  value={tempBio}
                  onChange={(e) => setTempBio(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none font-medium"
                  placeholder="e.g. Strict calisthenics athlete. Grinding 20 clean pull-ups, muscle-ups, and front levers. Consistency over hype!"
                />
              </div>

              {/* Featured Best Rank Selection */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-orange-400" />
                    <span>Showcased Best Rank</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setTempBestRank(computedActiveRank.title);
                      setTempBestRankTier(computedActiveRank.tier);
                      setIsCustomRank(false);
                    }}
                    className="text-[10px] font-mono text-orange-400 hover:underline"
                  >
                    Reset to Highest
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {/* Automatic Highest Rank Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setTempBestRank(computedActiveRank.title);
                      setTempBestRankTier(computedActiveRank.tier);
                      setIsCustomRank(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left border transition text-xs ${
                      !isCustomRank && tempBestRank === computedActiveRank.title
                        ? 'bg-orange-500/15 border-orange-500/50 text-white ring-1 ring-orange-500/30'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <RankBadge rankTitle={computedActiveRank.title} tier={computedActiveRank.tier} size="xs" />
                      <span className="text-[10px] font-mono font-bold text-orange-400 uppercase tracking-tight">(Highest Earned)</span>
                    </div>
                    {!isCustomRank && tempBestRank === computedActiveRank.title && (
                      <Check className="w-3.5 h-3.5 text-orange-400" />
                    )}
                  </button>

                  {/* Other Earned Ranks */}
                  {earnedRanks
                    .filter((r) => r.title !== computedActiveRank.title)
                    .slice(0, 6)
                    .map((rank) => (
                      <button
                        key={rank.id}
                        type="button"
                        onClick={() => {
                          setTempBestRank(rank.title);
                          setTempBestRankTier(rank.tier);
                          setIsCustomRank(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left border transition text-xs ${
                          !isCustomRank && tempBestRank === rank.title
                            ? 'bg-orange-500/15 border-orange-500/50 text-white ring-1 ring-orange-500/30'
                            : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <RankBadge rankTitle={rank.title} tier={rank.tier} size="xs" />
                          <span className="text-[10px] text-zinc-500 font-mono truncate">{rank.category}</span>
                        </div>
                        {!isCustomRank && tempBestRank === rank.title && (
                          <Check className="w-3.5 h-3.5 text-orange-400" />
                        )}
                      </button>
                    ))}

                  {/* Custom Rank Option */}
                  <button
                    type="button"
                    onClick={() => setIsCustomRank(true)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left border transition text-xs ${
                      isCustomRank
                        ? 'bg-orange-500/15 border-orange-500/50 text-white ring-1 ring-orange-500/30'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-[11px] font-mono font-bold text-zinc-300">✍️ Custom Rank Title</span>
                    {isCustomRank && <Check className="w-3.5 h-3.5 text-orange-400" />}
                  </button>
                </div>

                {isCustomRank && (
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 mt-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase font-mono">Custom Title</label>
                      <input
                        type="text"
                        maxLength={32}
                        value={tempBestRank}
                        onChange={(e) => setTempBestRank(e.target.value)}
                        className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-750 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                        placeholder="e.g. Iron Bar Berserker"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase font-mono">Badge Tier Styling</label>
                      <select
                        value={tempBestRankTier}
                        onChange={(e) => setTempBestRankTier(e.target.value as BadgeTier)}
                        className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-750 rounded-lg text-xs text-white font-mono"
                      >
                        <option value="copper">Copper Tier</option>
                        <option value="bronze">Bronze Tier</option>
                        <option value="silver">Silver Tier</option>
                        <option value="gold">Gold Tier</option>
                        <option value="platinum">Platinum Tier</option>
                        <option value="diamond">Diamond Tier</option>
                        <option value="red_diamond">Red Diamond Tier</option>
                        <option value="cosmic_obsidian">Cosmic Obsidian Tier</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-zinc-950 font-black text-xs rounded-xl shadow-lg transition active:scale-95 duration-100"
                >
                  Save Profile & Bio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Bottom Navigation Bar for Mobile Viewports */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-850 px-3 py-2.5 flex items-center justify-around shadow-2xl shadow-black pb-safe">
        <button
          onClick={() => onSelectTab('routines')}
          className={`flex flex-col items-center justify-center flex-1 text-center transition-all py-1 ${
            activeTab === 'routines'
              ? 'text-[#f97316] scale-105'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Dumbbell className="w-5.5 h-5.5 mb-1" />
          <span className="text-[10px] font-black tracking-tight font-display">Routines</span>
        </button>

        <button
          onClick={() => onSelectTab('calendar')}
          className={`flex flex-col items-center justify-center flex-1 text-center transition-all py-1 ${
            activeTab === 'calendar'
              ? 'text-[#f97316] scale-105'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Calendar className="w-5.5 h-5.5 mb-1" />
          <span className="text-[10px] font-black tracking-tight font-display">Calendar</span>
        </button>

        <button
          onClick={() => onSelectTab('ranks')}
          className={`flex flex-col items-center justify-center flex-1 text-center transition-all py-1 ${
            activeTab === 'ranks'
              ? 'text-[#f97316] scale-105'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Award className="w-5.5 h-5.5 mb-1" />
          <span className="text-[10px] font-black tracking-tight font-display">Ranks</span>
        </button>

        <button
          onClick={() => onSelectTab('prs')}
          className={`flex flex-col items-center justify-center flex-1 text-center transition-all py-1 ${
            activeTab === 'prs'
              ? 'text-[#f97316] scale-105'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Trophy className="w-5.5 h-5.5 mb-1" />
          <span className="text-[10px] font-black tracking-tight font-display">PRs & Stats</span>
        </button>

        <button
          onClick={() => onSelectTab('calculator')}
          className={`flex flex-col items-center justify-center flex-1 text-center transition-all py-1 ${
            activeTab === 'calculator'
              ? 'text-[#f97316] scale-105'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Calculator className="w-5.5 h-5.5 mb-1" />
          <span className="text-[10px] font-black tracking-tight font-display">Rank Calc</span>
        </button>

        <button
          onClick={() => onSelectTab('friends')}
          className={`flex flex-col items-center justify-center flex-1 text-center transition-all py-1 ${
            activeTab === 'friends'
              ? 'text-[#f97316] scale-105'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <Users className="w-5.5 h-5.5 mb-1" />
            {friendsCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-orange-500 text-zinc-950 text-[9px] font-bold rounded-full">
                {friendsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-black tracking-tight font-display">Friends</span>
        </button>
      </nav>
    </>
  );
};
