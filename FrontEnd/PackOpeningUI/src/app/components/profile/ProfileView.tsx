import { useEffect, useMemo, useState } from 'react';
import {
  UserCircle,
  Pencil,
  Check,
  X,
  Share2,
  Copy,
  Trophy,
  Package,
  DollarSign,
  Star,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  getCollectedCards,
  getProfile,
  saveProfile,
  type Card,
  type UserProfile,
} from '../binder/types';

const MAX_SHOWCASE = 8;

interface ProfileViewProps {
  currentUser: any;
  netReturn: number;
  packCount: number;
  onBackToPacks: () => void;
}

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  netReturn,
  packCount,
  onBackToPacks,
}) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [profile, setProfile] = useState<UserProfile>(() => getProfile());
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(profile.displayName);
  const [draftBio, setDraftBio] = useState(profile.bio);
  const [picking, setPicking] = useState(false);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = () => setCards(getCollectedCards());
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  const photoURL = currentUser?.photoURL;
  const initials = (profile.displayName || 'T')
    .split(' ')
    .map((p: string) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const collectionValue = useMemo(
    () => cards.reduce((s, c) => s + (c.currentPrice || 0), 0),
    [cards]
  );
  const slabbedCount = useMemo(
    () => cards.filter((c) => c.isSlabbed).length,
    [cards]
  );

  const showcaseCards = useMemo(
    () => profile.showcaseCardIds.map((id) => cards.find((c) => c.id === id)).filter(Boolean) as Card[],
    [profile.showcaseCardIds, cards]
  );

  const filteredCards = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = q
      ? cards.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            (c.setName || '').toLowerCase().includes(q)
        )
      : cards;
    return list.slice().sort((a, b) => (b.currentPrice || 0) - (a.currentPrice || 0));
  }, [cards, search]);

  const isSelected = (id: string) => profile.showcaseCardIds.includes(id);

  const toggleCard = (id: string) => {
    setProfile((prev) => {
      if (prev.showcaseCardIds.includes(id)) {
        return { ...prev, showcaseCardIds: prev.showcaseCardIds.filter((c) => c !== id) };
      }
      if (prev.showcaseCardIds.length >= MAX_SHOWCASE) return prev;
      return { ...prev, showcaseCardIds: [...prev.showcaseCardIds, id] };
    });
  };

  const saveEdits = async () => {
    const next: UserProfile = {
      ...profile,
      displayName: draftName.trim() || profile.displayName,
      bio: draftBio.trim(),
    };
    setProfile(next);
    setEditing(false);
    await saveProfile(next);
  };

  const cancelEdits = () => {
    setDraftName(profile.displayName);
    setDraftBio(profile.bio);
    setEditing(false);
  };

  const persistShowcase = async () => {
    setPicking(false);
    await saveProfile(profile);
  };

  const buildShareText = () => {
    const lines = [
      `🔥 POKÉ COLLECTOR PROFILE`,
      ``,
      `👤 ${profile.displayName}`,
      profile.bio ? `📝 ${profile.bio}` : ``,
      ``,
      `💰 Net Returns: $${fmt(netReturn)}`,
      `📦 Packs Opened: ${packCount}`,
      `🃏 Cards Owned: ${cards.length}  (${slabbedCount} graded)`,
      `📈 Collection Value: $${fmt(collectionValue)}`,
    ];
    if (showcaseCards.length) {
      lines.push(``, `⭐ Showcase:`);
      showcaseCards.forEach((c, i) =>
        lines.push(
          `   ${i + 1}. ${c.name}${c.isSlabbed ? ` [${c.slabGrade}]` : ''} — $${fmt(c.currentPrice || 0)}`
        )
      );
    }
    lines.push(``, `— Shared from the TCG Expo Circuit —`);
    return lines.filter((l) => l !== '').join('\n');
  };

  const handleShare = async () => {
    const text = buildShareText();
    try {
      if (navigator.share) {
        await navigator.share({ title: `${profile.displayName}'s Collection`, text });
        return;
      }
    } catch {
      /* fall through to copy */
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 w-full bg-gradient-to-b from-[#15151d] via-[#101017] to-[#0b0b0f]">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={onBackToPacks}
            className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" /> Back
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white text-sm font-bold shadow-lg transition-all"
          >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Share Profile'}
          </button>
        </div>

        {/* Identity card */}
        <div className="relative rounded-3xl border border-white/10 bg-[#16161f] p-6 overflow-hidden shadow-2xl">
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-purple-500/10 blur-2xl" />
          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border border-white/15 bg-[#0d0d13] flex items-center justify-center shadow-lg shrink-0">
              {photoURL ? (
                <img src={photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-fuchsia-300">{initials}</span>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left min-w-0">
              {editing ? (
                <div className="space-y-2">
                  <input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    placeholder="Display name"
                    className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-fuchsia-400"
                  />
                  <textarea
                    value={draftBio}
                    onChange={(e) => setDraftBio(e.target.value)}
                    placeholder="Short bio — let the floor know who you are..."
                    rows={2}
                    className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2 text-sm text-gray-200 resize-none focus:outline-none focus:border-fuchsia-400"
                  />
                  <div className="flex justify-center sm:justify-end gap-2">
                    <button
                      onClick={cancelEdits}
                      className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-300 text-xs font-bold hover:bg-white/5"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveEdits}
                      className="px-3 py-1.5 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h2 className="text-2xl font-black text-white truncate">{profile.displayName}</h2>
                    <button
                      onClick={() => setEditing(true)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-fuchsia-300 transition-colors"
                      title="Edit profile"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    {profile.bio || 'No bio yet — tap the pencil to add one.'}
                  </p>
                  {currentUser?.email && (
                    <p className="text-[11px] text-gray-600 mt-1 font-mono truncate">{currentUser.email}</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <StatCard
            icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
            label="Net Returns"
            value={`$${fmt(netReturn)}`}
            accent="from-emerald-500/15 to-emerald-500/5 border-emerald-500/20"
          />
          <StatCard
            icon={<Package className="w-5 h-5 text-amber-400" />}
            label="Packs Opened"
            value={`${packCount}`}
            accent="from-amber-500/15 to-amber-500/5 border-amber-500/20"
          />
          <StatCard
            icon={<Star className="w-5 h-5 text-sky-400" />}
            label="Cards Owned"
            value={`${cards.length}`}
            sub={`${slabbedCount} graded`}
            accent="from-sky-500/15 to-sky-500/5 border-sky-500/20"
          />
          <StatCard
            icon={<Trophy className="w-5 h-5 text-fuchsia-400" />}
            label="Collection Value"
            value={`$${fmt(collectionValue)}`}
            accent="from-fuchsia-500/15 to-fuchsia-500/5 border-fuchsia-500/20"
          />
        </div>

        {/* Showcase */}
        <div className="mt-7 rounded-3xl border border-white/10 bg-[#16161f] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-fuchsia-300" />
              <h3 className="text-lg font-black text-white tracking-wide">Card Showcase</h3>
              <span className="text-[11px] text-gray-500 font-mono">
                {profile.showcaseCardIds.length}/{MAX_SHOWCASE}
              </span>
            </div>
            <button
              onClick={() => (picking ? persistShowcase() : setPicking(true))}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-white/10 text-gray-200 hover:bg-white/5 flex items-center gap-1"
            >
              {picking ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Done
                </>
              ) : (
                <>
                  <Pencil className="w-3.5 h-3.5" /> Edit Showcase
                </>
              )}
            </button>
          </div>

          {showcaseCards.length === 0 && !picking ? (
            <div className="text-center py-10 text-gray-500 text-sm">
              No cards in your showcase yet. Hit <span className="text-fuchsia-300 font-bold">Edit Showcase</span> to pick your favorites.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {showcaseCards.map((c) => (
                <div
                  key={c.id}
                  className="relative rounded-xl overflow-hidden border border-white/10 bg-[#0d0d13] group"
                >
                  <img
                    src={c.imageUrl}
                    alt={c.name}
                    className="w-full aspect-[3/4] object-cover"
                    onError={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = 'hidden')}
                  />
                  <div className="p-2">
                    <p className="text-[11px] font-bold text-white truncate">{c.name}</p>
                    <p className="text-[10px] text-fuchsia-300 font-mono font-bold">
                      ${fmt(c.currentPrice || 0)}
                    </p>
                  </div>
                  {c.isSlabbed && (
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-amber-500/90 text-[9px] font-black text-black">
                      {c.slabGrade}
                    </span>
                  )}
                  {picking && (
                    <button
                      onClick={() => toggleCard(c.id)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-rose-500/90 text-white"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {picking && (
            <div className="mt-4 border-t border-white/10 pt-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search your collection to add..."
                className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2 text-sm text-white mb-3 focus:outline-none focus:border-fuchsia-400"
              />
              {filteredCards.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-6">
                  You have no cards in your collection yet. Open some packs!
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-80 overflow-y-auto pr-1">
                  {filteredCards.map((c) => {
                    const sel = isSelected(c.id);
                    const full = !sel && profile.showcaseCardIds.length >= MAX_SHOWCASE;
                    return (
                      <button
                        key={c.id}
                        disabled={full}
                        onClick={() => toggleCard(c.id)}
                        className={`relative rounded-lg overflow-hidden border text-left transition-all ${
                          sel
                            ? 'border-fuchsia-400 ring-2 ring-fuchsia-400/40'
                            : full
                            ? 'border-white/5 opacity-40 cursor-not-allowed'
                            : 'border-white/10 hover:border-fuchsia-400/60'
                        }`}
                      >
                        <img
                          src={c.imageUrl}
                          alt={c.name}
                          className="w-full aspect-[3/4] object-cover"
                          onError={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = 'hidden')}
                        />
                        {sel && (
                          <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-fuchsia-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-gray-600 mt-6">
          Tip: tap <Copy className="w-3 h-3 inline" /> Share Profile to copy a card-style summary and send it to friends.
        </p>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent: string;
}> = ({ icon, label, value, sub, accent }) => (
  <div className={`rounded-2xl border bg-gradient-to-br ${accent} p-3 flex flex-col gap-1`}>
    <div className="flex items-center gap-1.5">{icon}</div>
    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">{label}</p>
    <p className="text-lg font-black font-mono text-white leading-tight">{value}</p>
    {sub && <p className="text-[10px] text-gray-500 font-mono">{sub}</p>}
  </div>
);
