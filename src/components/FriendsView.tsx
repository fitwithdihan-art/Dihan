import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Check,
  X,
  Flame,
  Trophy,
  Share2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  Clock,
  Heart,
  Dumbbell,
  Edit3
} from 'lucide-react';
import { FriendProfile, FriendRequestItem, UserPreferences, AppData } from '../types';
import {
  INITIAL_COMMUNITY_ATHLETES,
  searchAthletesInFirestore,
  sendFriendRequestInFirestore,
  subscribeToIncomingFriendRequests,
  respondToFriendRequestInFirestore,
  syncPublicProfile,
} from '../utils/friendsService';
import { useAuth } from '../utils/authContext';
import { InviteFriendsModal } from './InviteFriendsModal';
import { RankBadge } from './RankBadge';
import { getActiveBestRank, getEarnedRanks, BadgeTier } from '../utils/rankService';

interface FriendsViewProps {
  userPreferences: UserPreferences;
  appData: AppData;
  onUpdatePreferences: (updated: Partial<UserPreferences>) => void;
  onUpdateFriends?: (friends: FriendProfile[]) => void;
  onStartRoutineWithFriend?: (friend: FriendProfile) => void;
  onOpenInvite?: () => void;
}

export const FriendsView: React.FC<FriendsViewProps> = ({
  userPreferences,
  appData,
  onUpdatePreferences,
  onUpdateFriends,
  onStartRoutineWithFriend,
  onOpenInvite,
}) => {
  const { user, signInWithGoogle } = useAuth();

  // Friends state: load from appData.localFriends or use default starter community friends
  const [friends, setFriends] = useState<FriendProfile[]>(() => {
    if (appData.localFriends && appData.localFriends.length > 0) {
      return appData.localFriends;
    }
    return INITIAL_COMMUNITY_ATHLETES.slice(0, 2);
  });

  const [activeSubTab, setActiveSubTab] = useState<'friends' | 'find' | 'requests' | 'leaderboard'>('friends');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestItem[]>([]);
  const [sentRequestIds, setSentRequestIds] = useState<Set<string>>(new Set());
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [selectedFriendForCompare, setSelectedFriendForCompare] = useState<FriendProfile | null>(null);
  const [fistBumpCount, setFistBumpCount] = useState<Record<string, number>>({});
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Best rank & bio calculations
  const myComputedRank = getActiveBestRank(appData);
  const myEarnedRanks = getEarnedRanks(appData);
  const displayedBestRank = userPreferences.bestRank || myComputedRank.title;
  const displayedBestRankTier: BadgeTier = (userPreferences.bestRankTier as BadgeTier) || myComputedRank.tier;
  const displayedBio = userPreferences.bio || 'Calisthenics athlete leveling up bodyweight strength and strict form.';

  const [isBioModalOpen, setIsBioModalOpen] = useState<boolean>(false);
  const [bioInput, setBioInput] = useState<string>(userPreferences.bio || '');
  const [rankInput, setRankInput] = useState<string>(userPreferences.bestRank || myComputedRank.title);
  const [rankTierInput, setRankTierInput] = useState<BadgeTier>(
    (userPreferences.bestRankTier as BadgeTier) || myComputedRank.tier
  );
  const [isCustomRankChoice, setIsCustomRankChoice] = useState<boolean>(false);

  const handleOpenBioModal = () => {
    setBioInput(userPreferences.bio || '');
    setRankInput(userPreferences.bestRank || myComputedRank.title);
    setRankTierInput((userPreferences.bestRankTier as BadgeTier) || myComputedRank.tier);
    setIsCustomRankChoice(false);
    setIsBioModalOpen(true);
  };

  const handleSaveBioAndRank = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePreferences({
      bio: bioInput.trim(),
      bestRank: rankInput.trim() || myComputedRank.title,
      bestRankTier: rankTierInput,
    });
    setIsBioModalOpen(false);
    showToast('Saved profile bio & showcased rank!');
  };

  // Current athlete stats
  const totalWorkouts = appData.sessions ? appData.sessions.length : 0;
  const athleteLevel = Math.max(1, Math.floor(totalWorkouts / 3) + 1);
  const myUsername = userPreferences.username || 'athlete_user';
  const myName = userPreferences.athleteName || 'Athlete';
  const friendCode = user ? user.uid.slice(0, 8).toUpperCase() : 'CALI-8842';

  const showToast = (msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => setNotificationToast(null), 3000);
  };

  // Sync user's public profile on mount if authenticated
  useEffect(() => {
    if (user) {
      syncPublicProfile(user, userPreferences, appData).catch((err) => {
        console.warn('Initial public profile sync:', err);
      });
    }
  }, [user, userPreferences, totalWorkouts]);

  // Subscribe to real-time incoming friend requests if authenticated
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToIncomingFriendRequests(user.uid, (requests) => {
      setIncomingRequests(requests);
    });
    return () => unsub();
  }, [user]);

  // Sync friends back to parent state whenever it changes
  const updateFriendList = (updated: FriendProfile[]) => {
    setFriends(updated);
    if (onUpdateFriends) {
      onUpdateFriends(updated);
    }
  };

  // Handle Search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Search in Firestore public profiles
      const cloudResults = await searchAthletesInFirestore(query);
      
      // Also search local community recommendations
      const localMatches = INITIAL_COMMUNITY_ATHLETES.filter(
        (a) =>
          a.username.toLowerCase().includes(query.toLowerCase()) ||
          a.athleteName.toLowerCase().includes(query.toLowerCase())
      );

      // Merge results uniquely
      const mergedMap = new Map<string, FriendProfile>();
      cloudResults.forEach((a) => mergedMap.set(a.username.toLowerCase(), a));
      localMatches.forEach((a) => {
        if (!mergedMap.has(a.username.toLowerCase())) {
          mergedMap.set(a.username.toLowerCase(), a);
        }
      });

      // Filter out self
      const finalResults = Array.from(mergedMap.values()).filter(
        (a) => a.username.toLowerCase() !== myUsername.toLowerCase()
      );

      setSearchResults(finalResults);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Add friend action
  const handleAddFriend = async (targetAthlete: FriendProfile) => {
    if (friends.some((f) => f.username.toLowerCase() === targetAthlete.username.toLowerCase())) {
      showToast(`${targetAthlete.athleteName} is already in your friends list!`);
      return;
    }

    setSentRequestIds((prev) => new Set(prev).add(targetAthlete.id));

    if (user) {
      try {
        await sendFriendRequestInFirestore(
          user,
          {
            username: myUsername,
            athleteName: myName,
            avatarUrl: userPreferences.avatarUrl,
          },
          targetAthlete
        );
        showToast(`Friend request sent to @${targetAthlete.username}!`);
      } catch (err) {
        console.error('Failed to send friend request:', err);
      }
    }

    // Instantly add to local friends list with celebration
    const updatedFriends = [targetAthlete, ...friends];
    updateFriendList(updatedFriends);
    showToast(`Added ${targetAthlete.athleteName} to friends!`);
  };

  // Accept incoming friend request
  const handleAcceptRequest = async (req: FriendRequestItem) => {
    if (user) {
      await respondToFriendRequestInFirestore(req.id, 'accepted');
    }
    const newFriend: FriendProfile = {
      id: req.fromUserId,
      userId: req.fromUserId,
      username: req.fromUsername,
      athleteName: req.fromAthleteName,
      avatarUrl: req.fromAvatarUrl,
      level: 5,
      totalWorkouts: 20,
      streak: 3,
      status: 'online',
    };
    updateFriendList([newFriend, ...friends]);
    setIncomingRequests((prev) => prev.filter((r) => r.id !== req.id));
    showToast(`Accepted friend request from ${req.fromAthleteName}!`);
  };

  // Decline incoming friend request
  const handleDeclineRequest = async (req: FriendRequestItem) => {
    if (user) {
      await respondToFriendRequestInFirestore(req.id, 'declined');
    }
    setIncomingRequests((prev) => prev.filter((r) => r.id !== req.id));
    showToast(`Declined request.`);
  };

  // Remove a friend
  const handleRemoveFriend = (friendId: string) => {
    const updated = friends.filter((f) => f.id !== friendId);
    updateFriendList(updated);
    if (selectedFriendForCompare?.id === friendId) {
      setSelectedFriendForCompare(null);
    }
    showToast(`Removed friend from list.`);
  };

  // Copy friend code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(friendCode);
    setCopiedCode(true);
    showToast(`Friend Code "${friendCode}" copied!`);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Fist bump interaction
  const handleFistBump = (friendId: string, friendName: string) => {
    setFistBumpCount((prev) => ({
      ...prev,
      [friendId]: (prev[friendId] || 0) + 1,
    }));
    showToast(`👊 You sent a fist bump to ${friendName}!`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Toast Notification */}
      {notificationToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 border border-orange-500/50 text-white text-xs sm:text-sm px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* Hero Profile & Friend Code Banner */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-16 -right-16 w-52 h-52 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              {userPreferences.avatarUrl ? (
                <img
                  src={userPreferences.avatarUrl}
                  alt={myName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-500/40 shadow-lg shadow-orange-500/10"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-zinc-800 border-2 border-orange-500/30 flex items-center justify-center text-orange-400 text-2xl font-bold font-display">
                  {myName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-zinc-950 flex items-center justify-center text-[10px] text-zinc-950 font-bold">
                ✓
              </span>
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-zinc-100 font-display">
                  {myName}
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
                  LVL {athleteLevel}
                </span>
                <RankBadge
                  rankTitle={displayedBestRank}
                  tier={displayedBestRankTier}
                  size="sm"
                  onClick={handleOpenBioModal}
                  title="Click to edit featured best rank"
                />
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400 pt-0.5">
                <span>@{myUsername}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-orange-400">
                  <Flame className="w-3.5 h-3.5" />
                  {appData.sessions ? appData.sessions.length : 0} Workouts
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-amber-300">
                  <Users className="w-3.5 h-3.5" />
                  {friends.length} Friends
                </span>
              </div>

              {/* Bio & Edit Bio/Rank Trigger */}
              <div className="pt-1 flex items-start gap-2 max-w-xl">
                <div className="px-3 py-1.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-xs text-zinc-300 italic flex-1 line-clamp-2">
                  "{displayedBio}"
                </div>
                <button
                  type="button"
                  onClick={handleOpenBioModal}
                  className="px-2.5 py-1.5 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-orange-400 text-xs font-mono font-bold transition flex items-center gap-1 shrink-0 border border-zinc-750 cursor-pointer active:scale-95"
                  title="Edit bio and showcase rank"
                >
                  <Edit3 className="w-3.5 h-3.5 text-orange-400" />
                  <span className="hidden sm:inline">Edit Bio & Rank</span>
                </button>
              </div>
            </div>
          </div>

          {/* Friend Code & Cloud Auth Status */}
          <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
            <div className="flex flex-wrap items-center gap-2 bg-zinc-900/90 border border-zinc-800 p-2 rounded-2xl">
              <div className="px-2.5 py-1.5 bg-zinc-950 rounded-xl font-mono text-xs font-bold text-orange-400 tracking-wider border border-zinc-800">
                {friendCode}
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold font-mono transition active:scale-95 cursor-pointer"
                title="Copy Friend Code"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={() => (onOpenInvite ? onOpenInvite() : setIsInviteModalOpen(true))}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-zinc-950 rounded-xl text-xs font-black font-mono transition active:scale-95 shadow-md shadow-orange-500/20 cursor-pointer"
                title="Open invite modal to share link, QR code or invite message"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Invite Friends</span>
              </button>
            </div>

            {!user && (
              <button
                type="button"
                onClick={signInWithGoogle}
                className="text-[11px] font-mono text-zinc-400 hover:text-orange-400 flex items-center gap-1.5 transition pt-1"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
                Sign in to sync friends across devices
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 gap-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('friends')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              activeSubTab === 'friends'
                ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>My Friends</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeSubTab === 'friends' ? 'bg-zinc-950 text-orange-400' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {friends.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('find')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              activeSubTab === 'find'
                ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Friends</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('requests')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap relative ${
              activeSubTab === 'requests'
                ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Requests</span>
            {incomingRequests.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {incomingRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('leaderboard')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              activeSubTab === 'leaderboard'
                ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Leaderboard</span>
          </button>
        </div>

        {/* Quick Invite Button on tab bar */}
        <button
          type="button"
          onClick={() => (onOpenInvite ? onOpenInvite() : setIsInviteModalOpen(true))}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/35 text-orange-400 text-xs font-mono font-bold transition active:scale-95 shrink-0"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Invite Friends</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MY FRIENDS LIST */}
      {/* ========================================================================= */}
      {activeSubTab === 'friends' && (
        <div className="space-y-4">
          {friends.length === 0 ? (
            <div className="bg-zinc-950/60 border border-dashed border-zinc-800 rounded-3xl p-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 text-orange-400 flex items-center justify-center mx-auto">
                <Users className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-zinc-200">No Friends Added Yet</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Calisthenics is best with a crew! Search for athletes or share your Friend Code to train together.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubTab('find')}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-zinc-950 rounded-xl text-xs font-bold font-mono transition inline-flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Find Athletes to Add
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {friends.map((friend) => {
                const bumps = fistBumpCount[friend.id] || 0;
                return (
                  <div
                    key={friend.id}
                    className="bg-zinc-900/70 border border-zinc-800 hover:border-zinc-750 rounded-2xl p-4 transition shadow-lg flex flex-col justify-between gap-4 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="relative">
                          {friend.avatarUrl ? (
                            <img
                              src={friend.avatarUrl}
                              alt={friend.athleteName}
                              className="w-13 h-13 rounded-xl object-cover border border-zinc-700"
                            />
                          ) : (
                            <div className="w-13 h-13 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-orange-400 font-bold font-display text-lg">
                              {friend.athleteName.charAt(0)}
                            </div>
                          )}
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-zinc-900 ${
                              friend.status === 'online'
                                ? 'bg-emerald-500'
                                : friend.status === 'training'
                                ? 'bg-orange-500 animate-pulse'
                                : 'bg-zinc-600'
                            }`}
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-zinc-100 font-display">
                              {friend.athleteName}
                            </h4>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                              LVL {friend.level}
                            </span>
                            <RankBadge
                              rankTitle={friend.bestRank || `LVL ${friend.level} Adept`}
                              tier={friend.bestRankTier}
                              size="xs"
                            />
                          </div>
                          <p className="text-xs text-zinc-400 font-mono">@{friend.username}</p>
                          {friend.favoriteExercise && (
                            <p className="text-[11px] text-zinc-400 flex items-center gap-1 pt-0.5">
                              <Dumbbell className="w-3 h-3 text-orange-400" />
                              {friend.favoriteExercise}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right font-mono shrink-0">
                        <div className="text-xs font-bold text-orange-400 flex items-center gap-1 justify-end">
                          <Flame className="w-3.5 h-3.5" />
                          {friend.streak}d streak
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {friend.totalWorkouts} sessions
                        </div>
                      </div>
                    </div>

                    {/* Friend Bio if present */}
                    {friend.bio && (
                      <p className="text-[11px] text-zinc-300 italic line-clamp-2 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-850/80">
                        "{friend.bio}"
                      </p>
                    )}

                    {/* Action Toolbar */}
                    <div className="flex items-center justify-between border-t border-zinc-800/60 pt-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedFriendForCompare(friend)}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-750 text-zinc-300 text-xs font-mono font-medium transition flex items-center gap-1.5"
                      >
                        <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
                        Compare
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleFistBump(friend.id, friend.athleteName)}
                          className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-orange-500/20 text-zinc-200 hover:text-orange-300 text-xs font-mono font-bold transition flex items-center gap-1 active:scale-90"
                          title="Send a Fist Bump"
                        >
                          <span>👊</span>
                          {bumps > 0 && <span className="text-[10px] text-orange-400">+{bumps}</span>}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveFriend(friend.id)}
                          className="p-1.5 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition"
                          title="Remove Friend"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FIND & ADD FRIENDS */}
      {/* ========================================================================= */}
      {activeSubTab === 'find' && (
        <div className="space-y-6">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search athlete by @username or full name..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500/60 transition shadow-inner font-mono"
            />
            {isSearching && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-orange-400 animate-pulse">
                Searching...
              </span>
            )}
          </div>

          {/* Search Results if any */}
          {searchQuery.trim().length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 block px-1">
                Search Results ({searchResults.length})
              </span>

              {searchResults.length === 0 && !isSearching ? (
                <div className="p-8 bg-zinc-950/40 border border-zinc-800/80 rounded-2xl text-center text-xs text-zinc-400">
                  No athletes found matching "{searchQuery}". You can share your Friend Code "{friendCode}" to invite them directly!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {searchResults.map((athlete) => {
                    const isAlreadyFriend = friends.some(
                      (f) => f.username.toLowerCase() === athlete.username.toLowerCase()
                    );
                    const isSent = sentRequestIds.has(athlete.id);

                    return (
                      <div
                        key={athlete.id}
                        className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          {athlete.avatarUrl ? (
                            <img
                              src={athlete.avatarUrl}
                              alt={athlete.athleteName}
                              className="w-11 h-11 rounded-xl object-cover border border-zinc-700"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-orange-400 font-bold font-display text-sm">
                              {athlete.athleteName.charAt(0)}
                            </div>
                          )}

                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-zinc-200">{athlete.athleteName}</h4>
                              <RankBadge
                                rankTitle={athlete.bestRank || `LVL ${athlete.level} Contender`}
                                tier={athlete.bestRankTier}
                                size="xs"
                              />
                            </div>
                            <p className="text-xs text-zinc-400 font-mono">@{athlete.username}</p>
                            {athlete.bio && (
                              <p className="text-[11px] text-zinc-300 italic line-clamp-1 max-w-[200px]">
                                "{athlete.bio}"
                              </p>
                            )}
                          </div>
                        </div>

                        {isAlreadyFriend ? (
                          <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20 shrink-0">
                            <Check className="w-3.5 h-3.5" />
                            Friends
                          </span>
                        ) : isSent ? (
                          <span className="text-xs font-mono text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-xl border border-orange-500/20 shrink-0">
                            Sent
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddFriend(athlete)}
                            className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-zinc-950 text-xs font-bold font-mono transition flex items-center gap-1 active:scale-95 shadow-md shadow-orange-500/20 shrink-0"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            Add
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Recommended Calisthenics Community Athletes */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                Featured Calisthenics Athletes
              </span>
              <span className="text-[11px] font-mono text-zinc-400">Discover partners</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {INITIAL_COMMUNITY_ATHLETES.map((athlete) => {
                const isAlreadyFriend = friends.some(
                  (f) => f.username.toLowerCase() === athlete.username.toLowerCase()
                );
                const isSent = sentRequestIds.has(athlete.id);

                return (
                  <div
                    key={athlete.id}
                    className="bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-4 transition flex flex-col justify-between gap-3 shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={athlete.avatarUrl}
                          alt={athlete.athleteName}
                          className="w-12 h-12 rounded-xl object-cover border border-zinc-700 shrink-0"
                        />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-sm font-bold text-zinc-200">{athlete.athleteName}</h4>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-orange-500/10 text-orange-400">
                              LVL {athlete.level}
                            </span>
                            <RankBadge
                              rankTitle={athlete.bestRank || `LVL ${athlete.level} Contender`}
                              tier={athlete.bestRankTier}
                              size="xs"
                            />
                          </div>
                          <p className="text-xs text-zinc-400 font-mono">@{athlete.username}</p>
                          <p className="text-[11px] text-zinc-400 font-mono">
                            Fav: <span className="text-zinc-300">{athlete.favoriteExercise}</span>
                          </p>
                        </div>
                      </div>

                      {isAlreadyFriend ? (
                        <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 shrink-0">
                          <Check className="w-3.5 h-3.5" />
                          Friends
                        </span>
                      ) : isSent ? (
                        <span className="text-xs font-mono text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-xl border border-orange-500/20 shrink-0">
                          Sent
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddFriend(athlete)}
                          className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-zinc-950 text-xs font-bold font-mono transition flex items-center gap-1.5 active:scale-95 shadow-md shadow-orange-500/20 shrink-0"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Add
                        </button>
                      )}
                    </div>

                    {athlete.bio && (
                      <p className="text-[11px] text-zinc-300 italic line-clamp-2 bg-zinc-950/60 p-2 rounded-xl border border-zinc-850/80">
                        "{athlete.bio}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: FRIEND REQUESTS */}
      {/* ========================================================================= */}
      {activeSubTab === 'requests' && (
        <div className="space-y-4">
          {incomingRequests.length === 0 ? (
            <div className="bg-zinc-950/60 border border-dashed border-zinc-800 rounded-3xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-500 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-zinc-300">No Pending Requests</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                When friends add you using your username or friend code, their requests will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {incomingRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-lg"
                >
                  <div className="flex items-center gap-3.5">
                    {req.fromAvatarUrl ? (
                      <img
                        src={req.fromAvatarUrl}
                        alt={req.fromAthleteName}
                        className="w-12 h-12 rounded-xl object-cover border border-zinc-700"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-orange-400 font-bold font-display">
                        {req.fromAthleteName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-zinc-100">{req.fromAthleteName}</h4>
                      <p className="text-xs text-zinc-400 font-mono">@{req.fromUsername}</p>
                      <span className="text-[10px] text-orange-400/80 font-mono">
                        Sent a friend request
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAcceptRequest(req)}
                      className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-zinc-950 text-xs font-bold font-mono transition flex items-center gap-1 active:scale-95 shadow-md shadow-orange-500/20"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeclineRequest(req)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-mono transition"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: LEADERBOARD */}
      {/* ========================================================================= */}
      {activeSubTab === 'leaderboard' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
              Friend Circle Rankings
            </span>
            <span className="text-[11px] font-mono text-orange-400">Ranked by Total Workouts</span>
          </div>

          {/* Ranking rows combining user and friends */}
          {(() => {
            const allRivals = [
              {
                id: 'me',
                athleteName: `${myName} (You)`,
                username: myUsername,
                avatarUrl: userPreferences.avatarUrl,
                level: athleteLevel,
                totalWorkouts: totalWorkouts,
                streak: 3,
                bestRank: displayedBestRank,
                bestRankTier: displayedBestRankTier,
                bio: displayedBio,
                isMe: true,
              },
              ...friends.map((f) => ({ ...f, isMe: false })),
            ].sort((a, b) => b.totalWorkouts - a.totalWorkouts);

            return (
              <div className="space-y-2">
                {allRivals.map((rival, index) => {
                  const rank = index + 1;
                  return (
                    <div
                      key={rival.id}
                      className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 transition shadow-sm ${
                        rival.isMe
                          ? 'bg-orange-500/10 border-orange-500/40 ring-1 ring-orange-500/20'
                          : 'bg-zinc-900/70 border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                            rank === 1
                              ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20'
                              : rank === 2
                              ? 'bg-zinc-300 text-zinc-950'
                              : rank === 3
                              ? 'bg-amber-700 text-white'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          #{rank}
                        </div>

                        {rival.avatarUrl ? (
                          <img
                            src={rival.avatarUrl}
                            alt={rival.athleteName}
                            className="w-10 h-10 rounded-xl object-cover border border-zinc-700 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-orange-400 font-bold font-display text-sm shrink-0">
                            {rival.athleteName.charAt(0)}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4
                              className={`text-sm font-bold ${
                                rival.isMe ? 'text-orange-400' : 'text-zinc-200'
                              }`}
                            >
                              {rival.athleteName}
                            </h4>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-zinc-800 text-zinc-400">
                              LVL {rival.level}
                            </span>
                            <RankBadge
                              rankTitle={rival.isMe ? displayedBestRank : (rival.bestRank || `LVL ${rival.level} Contender`)}
                              tier={rival.isMe ? displayedBestRankTier : rival.bestRankTier}
                              size="xs"
                            />
                          </div>
                          <p className="text-xs text-zinc-400 font-mono">@{rival.username}</p>
                          {rival.bio && (
                            <p className="text-[11px] text-zinc-300 italic line-clamp-1 mt-0.5">
                              "{rival.bio}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right font-mono shrink-0">
                        <div className="text-sm font-bold text-zinc-100 flex items-center gap-1 justify-end">
                          <Flame className="w-4 h-4 text-orange-500" />
                          {rival.totalWorkouts}
                        </div>
                        <div className="text-[10px] text-zinc-400">{rival.streak}d streak</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAT COMPARISON MODAL */}
      {/* ========================================================================= */}
      {selectedFriendForCompare && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-orange-400">
                <TrendingUp className="w-4 h-4" />
                Athlete Head-to-Head
              </div>
              <button
                type="button"
                onClick={() => setSelectedFriendForCompare(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Side-by-side avatars */}
            <div className="grid grid-cols-2 gap-4 text-center py-2">
              <div className="space-y-1.5 p-3 rounded-2xl bg-zinc-950/60 border border-orange-500/30 flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-zinc-800 border-2 border-orange-500/40 flex items-center justify-center text-orange-400 font-bold font-display text-lg mx-auto overflow-hidden">
                  {userPreferences.avatarUrl ? (
                    <img src={userPreferences.avatarUrl} alt="You" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    myName.charAt(0)
                  )}
                </div>
                <h4 className="text-xs font-bold text-orange-400 truncate w-full">{myName} (You)</h4>
                <div className="flex items-center gap-1.5 justify-center flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-orange-500/20 text-orange-300">
                    Level {athleteLevel}
                  </span>
                  <RankBadge rankTitle={displayedBestRank} tier={displayedBestRankTier} size="xs" />
                </div>
              </div>

              <div className="space-y-1.5 p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800 flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-zinc-300 font-bold font-display text-lg mx-auto overflow-hidden">
                  {selectedFriendForCompare.avatarUrl ? (
                    <img
                      src={selectedFriendForCompare.avatarUrl}
                      alt={selectedFriendForCompare.athleteName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    selectedFriendForCompare.athleteName.charAt(0)
                  )}
                </div>
                <h4 className="text-xs font-bold text-zinc-200 truncate w-full">
                  {selectedFriendForCompare.athleteName}
                </h4>
                <div className="flex items-center gap-1.5 justify-center flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400">
                    Level {selectedFriendForCompare.level}
                  </span>
                  <RankBadge
                    rankTitle={selectedFriendForCompare.bestRank || `LVL ${selectedFriendForCompare.level} Contender`}
                    tier={selectedFriendForCompare.bestRankTier}
                    size="xs"
                  />
                </div>
              </div>
            </div>

            {/* Profile Bio Head to Head */}
            <div className="p-3.5 bg-zinc-950/70 rounded-2xl border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-850 pb-1.5">
                <span className="text-orange-400">Your Bio</span>
                <span className="text-zinc-300">{selectedFriendForCompare.athleteName}'s Bio</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <p className="text-[11px] text-zinc-300 italic bg-zinc-900/80 p-2 rounded-xl border border-zinc-800 line-clamp-3">
                  "{displayedBio}"
                </p>
                <p className="text-[11px] text-zinc-300 italic bg-zinc-900/80 p-2 rounded-xl border border-zinc-800 line-clamp-3">
                  "{selectedFriendForCompare.bio || 'No bio written yet.'}"
                </p>
              </div>
            </div>

            {/* Comparative Metric Bars */}
            <div className="space-y-3 font-mono text-xs">
              {/* Metric 1: Total Workouts */}
              <div className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-850 space-y-1.5">
                <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                  <span className="font-bold text-orange-400">{totalWorkouts}</span>
                  <span className="uppercase tracking-wider">Total Workouts</span>
                  <span className="font-bold text-zinc-300">
                    {selectedFriendForCompare.totalWorkouts}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-zinc-800 overflow-hidden flex">
                  <div
                    className="bg-orange-500 transition-all duration-500"
                    style={{
                      width: `${
                        (totalWorkouts / Math.max(1, totalWorkouts + selectedFriendForCompare.totalWorkouts)) * 100
                      }%`,
                    }}
                  />
                  <div className="bg-zinc-600 flex-1" />
                </div>
              </div>

              {/* Metric 2: Workout Streak */}
              <div className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-850 space-y-1.5">
                <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                  <span className="font-bold text-orange-400">3d</span>
                  <span className="uppercase tracking-wider">Workout Streak</span>
                  <span className="font-bold text-zinc-300">{selectedFriendForCompare.streak}d</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-800 overflow-hidden flex">
                  <div
                    className="bg-amber-400 transition-all duration-500"
                    style={{
                      width: `${(3 / Math.max(1, 3 + selectedFriendForCompare.streak)) * 100}%`,
                    }}
                  />
                  <div className="bg-zinc-600 flex-1" />
                </div>
              </div>

              {/* Best Skill PR */}
              {selectedFriendForCompare.bestPr && (
                <div className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-850 flex items-center justify-between">
                  <span className="text-zinc-400 text-[11px]">Friend's Signature PR</span>
                  <span className="text-amber-400 font-bold text-xs">
                    {selectedFriendForCompare.bestPr}
                  </span>
                </div>
              )}
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleFistBump(selectedFriendForCompare.id, selectedFriendForCompare.athleteName);
                }}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-zinc-950 rounded-xl text-xs font-bold font-mono transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95"
              >
                <span>👊 Send Fist Bump</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedFriendForCompare(null)}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-mono transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Bio & Best Rank Customization Modal */}
      {isBioModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-orange-400">
                <Trophy className="w-4 h-4" />
                Customize Bio & Best Rank
              </div>
              <button
                type="button"
                onClick={() => setIsBioModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Profile Card Preview */}
            <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-2xl flex items-start gap-3 shadow-inner">
              {userPreferences.avatarUrl ? (
                <img
                  src={userPreferences.avatarUrl}
                  alt="You"
                  className="w-12 h-12 rounded-xl object-cover border border-zinc-700 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-orange-400 font-bold font-display text-base shrink-0">
                  {myName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold text-white truncate">{myName}</span>
                  <RankBadge
                    rankTitle={rankInput || myComputedRank.title}
                    tier={rankTierInput}
                    size="xs"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 font-mono">@{myUsername}</p>
                <p className="text-[11px] text-zinc-300 italic line-clamp-2 bg-zinc-900/70 p-1.5 rounded-lg border border-zinc-800">
                  "{bioInput || 'No bio written yet. Tell friends about your training style!'}"
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveBioAndRank} className="space-y-4">
              {/* Profile Bio Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <span>Profile Bio</span>
                    <span className="text-[10px] font-normal text-zinc-500 lowercase">(public to friends)</span>
                  </label>
                  <span className={`text-[10px] font-mono ${bioInput.length > 140 ? 'text-amber-400' : 'text-zinc-500'}`}>
                    {bioInput.length}/160
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={160}
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none font-medium"
                  placeholder="e.g. Strict form calisthenics. Aiming for 20 clean pull-ups and 10s front lever!"
                />
              </div>

              {/* Showcased Best Rank Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-orange-400" />
                    <span>Featured Best Rank</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setRankInput(myComputedRank.title);
                      setRankTierInput(myComputedRank.tier);
                      setIsCustomRankChoice(false);
                    }}
                    className="text-[10px] font-mono text-orange-400 hover:underline cursor-pointer"
                  >
                    Reset to Highest
                  </button>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {/* Default Highest Earned Rank */}
                  <button
                    type="button"
                    onClick={() => {
                      setRankInput(myComputedRank.title);
                      setRankTierInput(myComputedRank.tier);
                      setIsCustomRankChoice(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left border transition text-xs cursor-pointer ${
                      !isCustomRankChoice && rankInput === myComputedRank.title
                        ? 'bg-orange-500/15 border-orange-500/50 text-white ring-1 ring-orange-500/30'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <RankBadge rankTitle={myComputedRank.title} tier={myComputedRank.tier} size="xs" />
                      <span className="text-[10px] font-mono font-bold text-orange-400 uppercase tracking-tight">(Highest Earned)</span>
                    </div>
                    {!isCustomRankChoice && rankInput === myComputedRank.title && (
                      <Check className="w-3.5 h-3.5 text-orange-400" />
                    )}
                  </button>

                  {/* Other Earned Ranks */}
                  {myEarnedRanks
                    .filter((r) => r.title !== myComputedRank.title)
                    .slice(0, 6)
                    .map((rank) => (
                      <button
                        key={rank.id}
                        type="button"
                        onClick={() => {
                          setRankInput(rank.title);
                          setRankTierInput(rank.tier);
                          setIsCustomRankChoice(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left border transition text-xs cursor-pointer ${
                          !isCustomRankChoice && rankInput === rank.title
                            ? 'bg-orange-500/15 border-orange-500/50 text-white ring-1 ring-orange-500/30'
                            : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <RankBadge rankTitle={rank.title} tier={rank.tier} size="xs" />
                          <span className="text-[10px] text-zinc-500 font-mono truncate">{rank.category}</span>
                        </div>
                        {!isCustomRankChoice && rankInput === rank.title && (
                          <Check className="w-3.5 h-3.5 text-orange-400" />
                        )}
                      </button>
                    ))}

                  {/* Custom Rank Choice */}
                  <button
                    type="button"
                    onClick={() => setIsCustomRankChoice(true)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left border transition text-xs cursor-pointer ${
                      isCustomRankChoice
                        ? 'bg-orange-500/15 border-orange-500/50 text-white ring-1 ring-orange-500/30'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-[11px] font-mono font-bold text-zinc-300">✍️ Custom Rank Title</span>
                    {isCustomRankChoice && <Check className="w-3.5 h-3.5 text-orange-400" />}
                  </button>
                </div>

                {isCustomRankChoice && (
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 mt-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase font-mono">Custom Title</label>
                      <input
                        type="text"
                        maxLength={32}
                        value={rankInput}
                        onChange={(e) => setRankInput(e.target.value)}
                        className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-750 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                        placeholder="e.g. Iron Bar Berserker"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase font-mono">Badge Tier Styling</label>
                      <select
                        value={rankTierInput}
                        onChange={(e) => setRankTierInput(e.target.value as BadgeTier)}
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

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsBioModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-zinc-950 font-black text-xs rounded-xl shadow-lg transition active:scale-95 duration-100 cursor-pointer"
                >
                  Save Profile & Bio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Friends Modal */}
      <InviteFriendsModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        userPreferences={userPreferences}
        friendCode={friendCode}
        totalFriendsCount={friends.length}
        onInviteSuccess={() => {
          showToast('Squad invite link copied! Send it to your friends.');
        }}
      />
    </div>
  );
};
