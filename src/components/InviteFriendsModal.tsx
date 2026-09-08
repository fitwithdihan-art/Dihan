import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  QrCode,
  Sparkles,
  Flame,
  Award,
  Send,
  MessageCircle,
  Mail,
  Smartphone,
  Gift,
  Users,
  ExternalLink,
} from 'lucide-react';
import { FriendProfile, UserPreferences } from '../types';

interface InviteFriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPreferences: UserPreferences;
  friendCode: string;
  totalFriendsCount: number;
  onInviteSuccess?: () => void;
}

export const InviteFriendsModal: React.FC<InviteFriendsModalProps> = ({
  isOpen,
  onClose,
  userPreferences,
  friendCode,
  totalFriendsCount,
  onInviteSuccess,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'qr' | 'direct'>('link');
  const [selectedMessageStyle, setSelectedMessageStyle] = useState<'squad' | 'challenge' | 'casual'>('squad');
  const [directInput, setDirectInput] = useState('');
  const [directSentToast, setDirectSentToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://teenthenics.app';
  const username = userPreferences.username || 'athlete';
  const athleteName = userPreferences.athleteName || 'Athlete';
  const inviteUrl = `${origin}/?invite=${friendCode}&ref=${encodeURIComponent(username)}`;

  // Message templates
  const messageTemplates = {
    squad: `🔥 Yo! Join my calisthenics crew on Teenthenics. Let's track reps, unlock new skills, and level up together! Use my invite code: ${friendCode}\n👉 ${inviteUrl}`,
    challenge: `⚔️ Challenge alert! I'm tracking my calisthenics PRs on Teenthenics. Think you can beat my stats? Join my circle with code: ${friendCode}\n👉 ${inviteUrl}`,
    casual: `Hey! I'm using Teenthenics to track workouts and calisthenics progressions. Check it out and add me as a friend (Code: ${friendCode}):\n👉 ${inviteUrl}`,
  };

  const currentMessage = messageTemplates[selectedMessageStyle];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    if (onInviteSuccess) onInviteSuccess();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(friendCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(currentMessage);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2500);
    if (onInviteSuccess) onInviteSuccess();
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Train calisthenics with ${athleteName} on Teenthenics!`,
          text: currentMessage,
          url: inviteUrl,
        });
        if (onInviteSuccess) onInviteSuccess();
      } catch {
        // Fallback to copy link if user canceled or share failed
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(currentMessage)}`;
    window.open(url, '_blank');
    if (onInviteSuccess) onInviteSuccess();
  };

  const handleTelegramShare = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(
      `Join ${athleteName} on Teenthenics! Code: ${friendCode}`
    )}`;
    window.open(url, '_blank');
    if (onInviteSuccess) onInviteSuccess();
  };

  const handleSmsShare = () => {
    const url = `sms:?&body=${encodeURIComponent(currentMessage)}`;
    window.open(url, '_self');
    if (onInviteSuccess) onInviteSuccess();
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`${athleteName} invited you to train calisthenics on Teenthenics!`);
    const body = encodeURIComponent(currentMessage);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
    if (onInviteSuccess) onInviteSuccess();
  };

  const handleSendDirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directInput.trim()) return;

    setDirectSentToast(`Personalized invitation prepared for ${directInput.trim()}! Link copied.`);
    navigator.clipboard.writeText(currentMessage);
    setDirectInput('');
    setTimeout(() => setDirectSentToast(null), 3500);
    if (onInviteSuccess) onInviteSuccess();
  };

  // QR Code URL with styling
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    inviteUrl
  )}&color=f97316&bgcolor=18181b&margin=10`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 my-auto relative">
        {/* Glow Accent */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white font-display tracking-tight flex items-center gap-2">
                Invite Friends to Squad
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                Train, compare PRs & level up your calisthenics together
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center bg-zinc-950/70 p-1 rounded-2xl border border-zinc-800/80">
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-1.5 sm:py-2 rounded-xl text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'link'
                ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share & Link</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-1.5 sm:py-2 rounded-xl text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'qr'
                ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Gym QR Code</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('direct')}
            className={`flex-1 py-1.5 sm:py-2 rounded-xl text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'direct'
                ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Direct Invite</span>
          </button>
        </div>

        {/* Toast if direct sent */}
        {directSentToast && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-3.5 py-2 rounded-xl font-mono flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 shrink-0" />
            <span>{directSentToast}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: SHARE & LINK */}
        {/* ========================================================================= */}
        {activeTab === 'link' && (
          <div className="space-y-4">
            {/* Friend Code Box */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">
                  Your Athlete Friend Code
                </span>
                <span className="text-xl font-black font-mono text-orange-400 tracking-wider">
                  {friendCode}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition active:scale-95 self-start sm:self-auto"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Code Copied' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Invite Link Box */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase tracking-wider block">
                Direct Invite Link
              </label>
              <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-2xl p-2 pl-3">
                <input
                  type="text"
                  readOnly
                  value={inviteUrl}
                  className="bg-transparent text-xs text-zinc-300 font-mono flex-1 outline-none truncate select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-zinc-950 rounded-xl text-xs font-bold font-mono transition flex items-center gap-1.5 shrink-0 active:scale-95 shadow-md shadow-orange-500/20"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Message Style Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase tracking-wider flex items-center justify-between">
                <span>Choose Invitation Vibe</span>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="text-[10px] text-orange-400 hover:text-orange-300 font-bold transition flex items-center gap-1"
                >
                  {copiedMsg ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedMsg ? 'Copied Message' : 'Copy Full Text'}</span>
                </button>
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMessageStyle('squad')}
                  className={`py-2 px-2.5 rounded-xl border text-[11px] font-mono font-bold transition text-center ${
                    selectedMessageStyle === 'squad'
                      ? 'bg-orange-500/15 border-orange-500/50 text-orange-400'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  🔥 Squad Up
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMessageStyle('challenge')}
                  className={`py-2 px-2.5 rounded-xl border text-[11px] font-mono font-bold transition text-center ${
                    selectedMessageStyle === 'challenge'
                      ? 'bg-orange-500/15 border-orange-500/50 text-orange-400'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  ⚔️ PR Challenge
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMessageStyle('casual')}
                  className={`py-2 px-2.5 rounded-xl border text-[11px] font-mono font-bold transition text-center ${
                    selectedMessageStyle === 'casual'
                      ? 'bg-orange-500/15 border-orange-500/50 text-orange-400'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  🤝 Casual
                </button>
              </div>

              {/* Message Preview */}
              <div className="p-3 bg-zinc-950/70 border border-zinc-850 rounded-xl text-xs text-zinc-300 font-mono whitespace-pre-line leading-relaxed">
                {currentMessage}
              </div>
            </div>

            {/* Quick Share Buttons */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">
                Instant Share Via
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleTelegramShare}
                  className="p-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>Telegram</span>
                </button>

                <button
                  type="button"
                  onClick={handleSmsShare}
                  className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>SMS</span>
                </button>

                <button
                  type="button"
                  onClick={handleEmailShare}
                  className="p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </button>
              </div>

              {/* Native System Share Sheet */}
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full mt-2 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-zinc-950 font-black font-mono text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Open System Share Sheet</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: IN-PERSON GYM QR CODE */}
        {/* ========================================================================= */}
        {activeTab === 'qr' && (
          <div className="space-y-4 text-center py-2">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-zinc-200">Point Camera & Join Circle</h4>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                Have your gym or park buddy point their phone camera at this QR code to open Teenthenics and add you instantly.
              </p>
            </div>

            {/* QR Code Frame */}
            <div className="inline-block p-4 bg-zinc-950 rounded-3xl border-2 border-orange-500/40 shadow-2xl relative group">
              <img
                src={qrCodeUrl}
                alt="Teenthenics Friend Invite QR Code"
                className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl mx-auto object-contain bg-zinc-900"
              />
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
                <span className="font-mono text-xs font-bold text-orange-400">
                  {friendCode} • @{username}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Copied' : 'Copy Direct Link'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: DIRECT INVITE FORM */}
        {/* ========================================================================= */}
        {activeTab === 'direct' && (
          <form onSubmit={handleSendDirect} className="space-y-4 py-1">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-zinc-200">Send Direct Squad Invite</h4>
              <p className="text-xs text-zinc-400">
                Enter your friend's email or username handle to compose a customized calisthenics invite.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase tracking-wider block">
                Friend's Email or Username
              </label>
              <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-2xl p-2 pl-3">
                <input
                  type="text"
                  value={directInput}
                  onChange={(e) => setDirectInput(e.target.value)}
                  placeholder="e.g. friend@example.com or @alex_bars"
                  className="bg-transparent text-xs text-zinc-200 font-mono flex-1 outline-none placeholder:text-zinc-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!directInput.trim()}
              className="w-full py-3 bg-orange-500 disabled:opacity-50 hover:bg-orange-600 text-zinc-950 font-black font-mono text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Copy Tailored Invite For {directInput.trim() || 'Friend'}</span>
            </button>
          </form>
        )}

        {/* Referral Rewards Milestone Footer */}
        <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-zinc-300 flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-orange-400" />
              Squad Referral Milestones
            </span>
            <span className="text-orange-400 font-bold">{totalFriendsCount} Friends Added</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
            <div
              className={`p-2 rounded-xl border ${
                totalFriendsCount >= 1
                  ? 'bg-orange-500/15 border-orange-500/40 text-orange-300 font-bold'
                  : 'bg-zinc-950 border-zinc-850 text-zinc-500'
              }`}
            >
              <div>1 Friend</div>
              <div className="text-[9px] text-amber-400 font-bold">+50 Coins 🪙</div>
            </div>

            <div
              className={`p-2 rounded-xl border ${
                totalFriendsCount >= 3
                  ? 'bg-orange-500/15 border-orange-500/40 text-orange-300 font-bold'
                  : 'bg-zinc-950 border-zinc-850 text-zinc-500'
              }`}
            >
              <div>3 Friends</div>
              <div className="text-[9px] text-amber-400 font-bold">+150 Coins 🪙</div>
            </div>

            <div
              className={`p-2 rounded-xl border ${
                totalFriendsCount >= 5
                  ? 'bg-orange-500/15 border-orange-500/40 text-orange-300 font-bold'
                  : 'bg-zinc-950 border-zinc-850 text-zinc-500'
              }`}
            >
              <div>5 Friends</div>
              <div className="text-[9px] text-orange-400 font-bold">Obsidian Theme 👑</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
