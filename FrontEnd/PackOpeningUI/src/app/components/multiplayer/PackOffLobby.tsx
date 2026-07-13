import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, Plus, LogIn, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createMatch, joinMatch } from '../../services/matchmaking';
import { sound } from '../../services/sound';

interface PackOffLobbyProps {
  onBack: () => void;
  onEnterArena: (matchId: string) => void;
  selectedPackId: string;
}

export const PackOffLobby: React.FC<PackOffLobbyProps> = ({ onBack, onEnterArena, selectedPackId }) => {
  const { currentUser } = useAuth();
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Guest Player';

  const getGuestId = () => {
    let gid = sessionStorage.getItem('guestId');
    if (!gid) {
      gid = `guest_${Math.random().toString(36).substring(7)}`;
      sessionStorage.setItem('guestId', gid);
    }
    return gid;
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      setError('');
      sound.playButtonClick();
      const uid = currentUser?.uid || getGuestId();
      const matchId = await createMatch(uid, currentUser?.email?.split('@')[0] || 'Guest', selectedPackId);
      onEnterArena(matchId);
    } catch (err: any) {
      setError(err.message || 'Failed to create room');
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode || joinCode.length !== 5) {
      setError('Please enter a valid 5-character room code');
      return;
    }
    try {
      setLoading(true);
      setError('');
      sound.playButtonClick();
      const uid = currentUser?.uid || getGuestId();
      await joinMatch(joinCode.toUpperCase(), uid, currentUser?.email?.split('@')[0] || 'Guest');
      onEnterArena(joinCode.toUpperCase());
    } catch (err: any) {
      setError(err.message || 'Failed to join room');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <div className="w-full max-w-md bg-[#14141c]/90 border border-amber-500/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(245,158,11,0.15)] backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="text-amber-400 w-6 h-6" /> Pack-Off Lobby
          </h2>
        </div>

        <div className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
          <p className="text-sm text-gray-400 uppercase tracking-wider font-bold mb-1">Playing As</p>
          <p className="text-xl text-amber-300 font-black">{displayName}</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm font-bold text-center">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-lg flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-[1.02] transition-transform disabled:opacity-50"
          >
            <Plus className="w-6 h-6" /> Create New Room
          </button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink-0 mx-4 text-gray-500 font-bold text-sm uppercase">OR JOIN FRIEND</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 5))}
              placeholder="ROOM CODE"
              className="flex-1 bg-black/40 border border-white/20 rounded-xl px-4 text-center text-xl font-mono font-bold text-white uppercase outline-none focus:border-amber-400 transition-colors"
            />
            <button
              onClick={handleJoin}
              disabled={loading || joinCode.length !== 5}
              className="px-6 rounded-xl bg-[#1f1f2e] border border-white/20 text-white font-bold hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <LogIn className="w-5 h-5" /> Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
