import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, Copy, Check, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { subscribeToMatch, updatePlayerState, updateMatchStatus, MatchState, PlayerState } from '../../services/matchmaking';
import BoosterPackTear from '../BoosterPackTear';
import { sound } from '../../services/sound';

interface PackOffArenaProps {
  matchId: string;
  onLeave: () => void;
  packArts: string[];
  setName: string;
  renderCardStack: (cards: any[], revealedIndex: number) => React.ReactNode;
  generateCards: () => any[]; // Function from App to generate the 11 cards
}

export const PackOffArena: React.FC<PackOffArenaProps> = ({ 
  matchId, 
  onLeave, 
  packArts, 
  setName,
  renderCardStack,
  generateCards
}) => {
  const { currentUser } = useAuth();
  const [match, setMatch] = useState<MatchState | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToMatch(matchId, (matchData) => {
      setMatch(matchData);
    });
    return () => unsubscribe();
  }, [matchId]);

  if (!match) {
    return <div className="flex items-center justify-center min-h-[60vh] text-white">Loading Arena...</div>;
  }

  const localUserId = currentUser?.uid;
  const isPlayer1 = match.player1?.uid === localUserId;
  const localPlayer = isPlayer1 ? match.player1 : match.player2;
  const remotePlayer = isPlayer1 ? match.player2 : match.player1;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(matchId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReady = async () => {
    if (!localPlayer) return;
    sound.playButtonClick();
    
    // Generate cards for the pack when ready
    const cards = generateCards();
    
    await updatePlayerState(matchId, isPlayer1 ? 'player1' : 'player2', { 
      isReady: true,
      cards 
    });

    // If the other player is also ready, update match status to playing
    if (remotePlayer?.isReady) {
      await updateMatchStatus(matchId, 'playing');
    }
  };

  const handleLocalPackProgress = (progress: number) => {
    if (match.status !== 'playing' || !localPlayer) return;
    updatePlayerState(matchId, isPlayer1 ? 'player1' : 'player2', { packProgress: progress });
  };

  const handleLocalTearComplete = () => {
    if (match.status !== 'playing' || !localPlayer) return;
    updatePlayerState(matchId, isPlayer1 ? 'player1' : 'player2', { packProgress: 100 });
  };

  const handleRevealNext = () => {
    if (match.status !== 'playing' || !localPlayer || !localPlayer.cards) return;
    const nextIndex = localPlayer.revealedIndex + 1;
    if (nextIndex < localPlayer.cards.length) {
      sound.playCardFlip();
      updatePlayerState(matchId, isPlayer1 ? 'player1' : 'player2', { revealedIndex: nextIndex });
    }
  };

  // Determine pack stage
  const getPackStage = (player: PlayerState | null) => {
    if (match.status !== 'playing') return 'unopened';
    if (!player) return 'unopened';
    if (player.packProgress >= 100) return 'opened';
    if (player.packProgress > 0) return 'tearing';
    return 'unopened';
  };

  const renderPlayerSide = (player: PlayerState | null, isLocal: boolean) => {
    if (!player) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 border border-white/5 rounded-3xl bg-black/20">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Waiting for opponent...</p>
        </div>
      );
    }

    const stage = getPackStage(player);
    const isWinner = false; // Logic for winning can be added later

    return (
      <div className={`flex-1 flex flex-col items-center p-4 relative ${isLocal ? '' : 'opacity-90'}`}>
        {/* Player Header */}
        <div className={`w-full max-w-sm rounded-2xl p-4 mb-8 flex items-center justify-between border ${isLocal ? 'bg-amber-500/10 border-amber-500/30' : 'bg-blue-500/10 border-blue-500/30'}`}>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase mb-1">{isLocal ? 'You' : 'Opponent'}</p>
            <p className={`text-xl font-black ${isLocal ? 'text-amber-400' : 'text-blue-400'}`}>{player.displayName}</p>
          </div>
          <div className="flex flex-col items-end">
            {match.status === 'waiting' || match.status === 'ready' ? (
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${player.isReady ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'bg-white/10 text-gray-400'}`}>
                {player.isReady ? 'READY' : 'NOT READY'}
              </span>
            ) : (
              <span className="text-xs font-mono text-gray-400">
                Cards: {Math.max(0, player.revealedIndex + 1)} / {player.cards?.length || 0}
              </span>
            )}
          </div>
        </div>

        {/* Action Area */}
        <div className="flex-1 w-full flex flex-col items-center justify-center">
          {match.status === 'playing' ? (
            stage === 'opened' ? (
              <div 
                className="relative w-full h-full min-h-[400px] flex items-center justify-center"
                onClick={isLocal ? handleRevealNext : undefined}
              >
                {renderCardStack(player.cards || [], player.revealedIndex)}
                
                {isLocal && player.revealedIndex < (player.cards?.length || 0) - 1 && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer z-50">
                    <span className="px-4 py-2 rounded-full bg-amber-500 text-black font-black uppercase text-sm shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                      Click to Reveal
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div onClick={isLocal && stage === 'unopened' ? () => handleLocalPackProgress(100) : undefined}>
                <BoosterPackTear
                  packArts={packArts}
                  packArtIndex={0}
                  onPrevPackArt={() => {}}
                  onNextPackArt={() => {}}
                  onTearComplete={isLocal ? handleLocalTearComplete : () => {}}
                  setName={setName}
                  packStage={stage}
                  remainingCardsCount={11}
                  isRemote={!isLocal}
                  overrideProgress={isLocal ? undefined : player.packProgress}
                />
              </div>
            )
          ) : (
            <div className="text-center">
              {isLocal && !player.isReady && (
                <button
                  onClick={handleReady}
                  className="px-8 py-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-xl shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:scale-105 transition-transform"
                >
                  I'm Ready!
                </button>
              )}
              {isLocal && player.isReady && (
                <p className="text-green-400 font-bold text-lg animate-pulse">Waiting for opponent to ready up...</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#0d0d0f] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-16 border-b border-white/10 bg-black/40 flex items-center justify-between px-6 shrink-0">
        <button onClick={onLeave} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-bold text-sm">
          <LogOut className="w-4 h-4" /> Leave Room
        </button>
        
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-sm font-bold uppercase tracking-widest">Room Code:</span>
          <div 
            onClick={handleCopyCode}
            className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
          >
            <span className="font-mono text-amber-400 font-bold tracking-widest">{matchId}</span>
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </div>
        </div>
        
        <div className="w-24"></div> {/* Spacer for centering */}
      </div>

      {/* Split Screen Arena */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        {/* VS Divider */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:flex flex-col items-center">
          <div className="w-px h-32 bg-gradient-to-b from-transparent via-amber-500/50 to-transparent"></div>
          <div className="w-12 h-12 rounded-full bg-[#14141c] border-2 border-amber-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.3)] my-4">
            <span className="text-amber-400 font-black italic">VS</span>
          </div>
          <div className="w-px h-32 bg-gradient-to-t from-transparent via-amber-500/50 to-transparent"></div>
        </div>

        {/* Left Side: Local Player */}
        <div className="flex-1 border-b md:border-b-0 md:border-r border-white/10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1c1c24] to-[#0d0d0f] flex flex-col">
          {renderPlayerSide(localPlayer, true)}
        </div>

        {/* Right Side: Remote Player */}
        <div className="flex-1 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#14141c] to-[#0a0a0c] flex flex-col">
          {renderPlayerSide(remotePlayer, false)}
        </div>
      </div>
    </div>
  );
};
