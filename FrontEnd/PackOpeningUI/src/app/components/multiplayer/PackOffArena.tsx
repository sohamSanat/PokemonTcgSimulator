import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, Copy, Check, Users, X, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { subscribeToMatch, updatePlayerState, updateMatchStatus, updateMatchPack, finalizeRound, transferCard, MatchState, PlayerState } from '../../services/matchmaking';
import BoosterPackTear from '../BoosterPackTear';
import { sound } from '../../services/sound';
import { ErrorBoundary } from '../ErrorBoundary';
import { BinderExportModal } from './BinderExportModal';

interface PackOffArenaProps {
  matchId: string;
  onLeave: () => void;
  packArts: string[];
  setName: string;
  renderCardStack: (cards: any[], revealedIndex: number) => React.ReactNode;
  generateCards: () => Promise<any[]> | any[]; // Function from App to generate the 11 cards
  onLoadPack?: (setId: string) => void;
  onChangeSetRequest?: () => void;
}

export const PackOffArena: React.FC<PackOffArenaProps> = ({ 
  matchId, 
  onLeave, 
  packArts, 
  setName,
  renderCardStack,
  generateCards,
  onLoadPack,
  onChangeSetRequest
}) => {
  const { currentUser } = useAuth();
  const [match, setMatch] = useState<MatchState | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewingBookletPlayer, setViewingBookletPlayer] = useState<PlayerState | null>(null);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToMatch(matchId, (matchData) => {
      setMatch(matchData);
    });
    return () => unsubscribe();
  }, [matchId]);

  useEffect(() => {
    if (match?.packId && onLoadPack) {
      onLoadPack(match.packId);
    }
  }, [match?.packId, onLoadPack]);

  const localUserId = currentUser?.uid || 'guest';
  const isPlayer1 = match?.player1?.uid === localUserId;
  const localPlayer = match ? (isPlayer1 ? match.player1 : match.player2) : null;
  const remotePlayer = match ? (isPlayer1 ? match.player2 : match.player1) : null;

  const isGameOver = !!(
    localPlayer?.cards && localPlayer.cards.length > 0 &&
    remotePlayer?.cards && remotePlayer.cards.length > 0 &&
    localPlayer.revealedIndex >= localPlayer.cards.length - 1 && 
    remotePlayer.revealedIndex >= remotePlayer.cards.length - 1
  );

  // Calculate revenue dynamically so we can use it inside the useEffect if needed
  const calculateRevenue = (p: PlayerState | null) => {
    if (!p || !p.cards || p.cards.length === 0 || p.revealedIndex < 0) return 0;
    let total = 0;
    const topIdx = Math.max(0, p.cards.length - 1 - Math.max(0, p.revealedIndex));
    for (let i = topIdx; i < p.cards.length; i++) {
      total += p.cards[i]?.value || 0;
    }
    return total;
  };

  const localRevenue = calculateRevenue(localPlayer);
  const remoteRevenue = calculateRevenue(remotePlayer);

  useEffect(() => {
    if (isGameOver && match?.status === 'playing' && isPlayer1) {
      // Determine winner based on revenue
      const p1Revenue = isPlayer1 ? localRevenue : remoteRevenue;
      const p2Revenue = isPlayer1 ? remoteRevenue : localRevenue;
      
      let winnerId: string | null = null;
      let p1LossStreak = match.player1?.lossStreak || 0;
      let p2LossStreak = match.player2?.lossStreak || 0;

      if (p1Revenue > p2Revenue) {
        winnerId = match.player1?.uid || null;
        p1LossStreak = 0;
        p2LossStreak += 1;
      } else if (p2Revenue > p1Revenue) {
        winnerId = match.player2?.uid || null;
        p1LossStreak += 1;
        p2LossStreak = 0;
      } else {
        // Tie
        p1LossStreak = 0;
        p2LossStreak = 0;
      }

      // Add a slight delay before triggering the picking phase
      const timer = setTimeout(() => {
        finalizeRound(matchId, winnerId, p1LossStreak, p2LossStreak);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isGameOver, match?.status, isPlayer1, localRevenue, remoteRevenue, matchId, match?.player1, match?.player2]);

  useEffect(() => {
    if (
      match && 
      match.status !== 'playing' && 
      match.status !== 'finished' && 
      match.status !== 'picking' &&
      localPlayer?.isReady && 
      remotePlayer?.isReady && 
      isPlayer1
    ) {
      updateMatchStatus(matchId, 'playing');
    }
  }, [match?.status, localPlayer?.isReady, remotePlayer?.isReady, isPlayer1, matchId]);

  useEffect(() => {
    if (match?.status === 'picking' && isPlayer1) {
      const p1Eligible = (match.winnerId === match.player1?.uid) || ((match.player1?.lossStreak || 0) >= 3);
      const p2Eligible = (match.winnerId === match.player2?.uid) || ((match.player2?.lossStreak || 0) >= 3);
      
      const p1Done = !p1Eligible || match.player1?.hasPickedCard;
      const p2Done = !p2Eligible || match.player2?.hasPickedCard;
      
      if (p1Done && p2Done) {
        updateMatchStatus(matchId, 'finished');
      }
    }
  }, [match?.status, match?.winnerId, match?.player1?.hasPickedCard, match?.player2?.hasPickedCard, match?.player1?.lossStreak, match?.player2?.lossStreak, isPlayer1, matchId]);

  if (!match) {
    return <div className="flex items-center justify-center min-h-[60vh] text-white">Loading Arena...</div>;
  }



  const handleCopyCode = () => {
    navigator.clipboard.writeText(matchId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReady = async () => {
    if (!localPlayer) return;
    sound.playButtonClick();
    
    // Generate cards for the pack when ready
    const cards = await generateCards();
    
    await updatePlayerState(matchId, isPlayer1 ? 'player1' : 'player2', { 
      isReady: true,
      cards 
    });
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



  const getRevealedCards = (p: PlayerState | null) => {
    if (!p || !p.cards || p.cards.length === 0 || p.revealedIndex < 0) return [];
    const topIdx = Math.max(0, p.cards.length - 1 - Math.max(0, p.revealedIndex));
    return p.cards.slice(topIdx);
  };

  const getBookletCards = (p: PlayerState | null) => {
    if (!p) return [];
    const allCards = [...(p.booklet || []), ...getRevealedCards(p)];
    return allCards.sort((a, b) => (b.value || 0) - (a.value || 0));
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
      <div className={`w-full md:flex-1 flex flex-col items-center p-4 relative py-8 md:py-4 ${isLocal ? '' : 'opacity-90'}`}>
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
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs font-mono text-gray-400">
                  Cards: {Math.max(0, player.revealedIndex + 1)} / {player.cards?.length || 0}
                </span>
                <span className={`font-bold font-mono ${isLocal ? 'text-amber-400' : 'text-blue-400'}`}>
                  ${calculateRevenue(player).toFixed(2)}
                </span>
              </div>
            )}
            <button 
              onClick={() => setViewingBookletPlayer(player)}
              className="mt-2 flex items-center gap-1.5 text-[10px] uppercase font-bold text-gray-400 hover:text-white border border-gray-700 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-colors"
            >
              <BookOpen className="w-3 h-3" /> View Booklet
            </button>
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
                  <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer z-50">
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
  // Card Stealing Logic
  const isWinner = match?.winnerId === localPlayer?.uid;
  const isPityPick = !isWinner && (localPlayer?.lossStreak || 0) >= 3;
  const isPicking = match?.status === 'picking';
  const canPick = isPicking && (isWinner || isPityPick) && !localPlayer?.hasPickedCard;
  
  const pickingTarget = canPick ? remotePlayer : null;
  const pickingTargetCards = getBookletCards(pickingTarget);
  const mostExpensiveCardId = pickingTargetCards.length > 0 ? pickingTargetCards[0].id : null;

  const handlePickCard = async (cardId: string) => {
    if (!canPick) return;
    if (isPityPick && cardId === mostExpensiveCardId) return; // Cannot pick most expensive during pity pick
    
    sound.playButtonClick();
    await transferCard(matchId, isPlayer1 ? 'player2' : 'player1', isPlayer1 ? 'player1' : 'player2', cardId);
  };


  return (
    <ErrorBoundary>
    <div className="relative min-h-full w-full bg-[#0d0d0f] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 h-16 border-b border-white/10 bg-black/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
        <button onClick={() => setShowExportModal(true)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-bold text-sm">
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
        
        <div className="w-24 flex justify-end">
          {isPlayer1 && match.status !== 'playing' && onChangeSetRequest && (
            <button 
              onClick={onChangeSetRequest}
              className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/40 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-colors"
            >
              Change Set
            </button>
          )}
        </div>
      </div>

      {/* Split Screen Arena */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        {match.status === 'finished' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
              className="bg-[#14141c] border-2 border-white/10 rounded-3xl p-8 flex flex-col items-center shadow-[0_0_100px_rgba(245,158,11,0.2)]"
            >
              <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 mb-6 drop-shadow-lg text-center">
                {match.winnerId === localPlayer?.uid ? 'YOU WON!' : match.winnerId === remotePlayer?.uid ? 'YOU LOST' : 'TIE!'}
              </h2>
              <div className="flex gap-12 text-xl font-mono items-center">
                <div className="flex flex-col items-center">
                  <span className="text-gray-400 text-xs mb-1 uppercase tracking-widest">{localPlayer?.displayName}</span>
                  <span className="text-amber-400 font-bold text-3xl">${localRevenue.toFixed(2)}</span>
                </div>
                <div className="text-gray-600 font-bold text-2xl">VS</div>
                <div className="flex flex-col items-center">
                  <span className="text-gray-400 text-xs mb-1 uppercase tracking-widest">{remotePlayer?.displayName}</span>
                  <span className="text-blue-400 font-bold text-3xl">${remoteRevenue.toFixed(2)}</span>
                </div>
              </div>
              
              {isPlayer1 && (
                <div className="flex gap-4 mt-8">
                  <button 
                    onClick={() => updateMatchPack(matchId, match.packId)}
                    className="bg-amber-500 text-black px-6 py-3 rounded-xl font-black uppercase tracking-wider hover:bg-amber-400 transition-colors shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95"
                  >
                    Play Again
                  </button>
                  {onChangeSetRequest && (
                    <button 
                      onClick={onChangeSetRequest}
                      className="bg-[#181822] text-amber-500 border-2 border-amber-500/50 px-6 py-3 rounded-xl font-black uppercase tracking-wider hover:bg-[#222230] transition-colors hover:scale-105 active:scale-95"
                    >
                      Change Set
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Picking Phase Overlay */}
        {isPicking && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-start bg-black/90 backdrop-blur-md pt-24 px-8 overflow-y-auto">
            {!canPick ? (
              <div className="text-center mt-32">
                <h2 className="text-3xl font-black text-amber-400 animate-pulse">Waiting for opponent to pick...</h2>
              </div>
            ) : (
              <div className="w-full max-w-6xl mx-auto pb-12">
                <h2 className="text-4xl font-black text-white text-center mb-2">
                  {isWinner ? "YOU WON! STEAL 1 CARD!" : "PITY PICK! CHOOSE 1 CARD"}
                </h2>
                <p className="text-gray-400 text-center mb-8">
                  {isWinner 
                    ? `Pick one card from ${pickingTarget?.displayName}'s booklet to keep.` 
                    : `You've lost 3 times in a row. Pick any card from ${pickingTarget?.displayName}'s booklet (except the most expensive one).`}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                  {pickingTargetCards.map((card, idx) => {
                    const isDisabled = isPityPick && card.id === mostExpensiveCardId;
                    return (
                      <motion.div 
                        key={`${card.id}-${idx}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        onClick={() => handlePickCard(card.id)}
                        className={`relative group rounded-xl overflow-hidden bg-[#181822] border-2 transition-all ${isDisabled ? 'border-red-500/50 opacity-50 cursor-not-allowed' : 'border-white/10 hover:border-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] cursor-pointer'}`}
                      >
                        <div className="w-full pt-[139%] relative">
                          <img 
                            src={card.pokemon?.images?.large || card.pokemon?.images?.small || ''}
                            alt={card.pokemon?.name || 'Pokemon Card'}
                            className="absolute inset-0 w-full h-full object-contain p-2 drop-shadow-xl"
                            loading="lazy"
                          />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent flex justify-between items-end">
                          <span className="text-xs font-bold text-white truncate pr-2">{card.pokemon?.name}</span>
                          <span className="text-xs font-mono text-amber-400 font-bold shrink-0">${(card.value || 0).toFixed(2)}</span>
                        </div>
                        {isDisabled && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
                            <span className="bg-red-500 text-white font-black text-xs px-2 py-1 rounded">LOCKED</span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VS Divider */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:flex flex-col items-center">
          <div className="w-px h-32 bg-gradient-to-b from-transparent via-amber-500/50 to-transparent"></div>
          <div className="w-12 h-12 rounded-full bg-[#14141c] border-2 border-amber-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.3)] my-4">
            <span className="text-amber-400 font-black italic">VS</span>
          </div>
          <div className="w-px h-32 bg-gradient-to-t from-transparent via-amber-500/50 to-transparent"></div>
        </div>

        {/* Left Side: Local Player */}
        <div className="w-full md:flex-1 border-b md:border-b-0 md:border-r border-white/10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1c1c24] to-[#0d0d0f] flex flex-col min-h-[60vh] md:min-h-0">
          {renderPlayerSide(localPlayer, true)}
        </div>

        {/* Right Side: Remote Player */}
        <div className="w-full md:flex-1 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#14141c] to-[#0a0a0c] flex flex-col min-h-[60vh] md:min-h-0">
          {renderPlayerSide(remotePlayer, false)}
        </div>
      </div>

      {/* Booklet Modal */}
      <AnimatePresence>
        {viewingBookletPlayer && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex flex-col p-4 md:p-8"
          >
            <div className="flex items-center justify-between mb-8 max-w-6xl mx-auto w-full shrink-0">
              <div>
                <h2 className="text-3xl font-black text-white">{viewingBookletPlayer.displayName}'s Booklet</h2>
                <p className="text-gray-400 font-mono mt-1">Total Cards: {getBookletCards(viewingBookletPlayer).length} | Revenue: ${getBookletCards(viewingBookletPlayer).reduce((sum, c) => sum + (c.value || 0), 0).toFixed(2)}</p>
              </div>
              <button 
                onClick={() => setViewingBookletPlayer(null)}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto max-w-6xl mx-auto w-full pr-4 pb-12 custom-scrollbar">
              {getBookletCards(viewingBookletPlayer).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-50">
                  <BookOpen className="w-16 h-16 text-gray-500 mb-4" />
                  <p className="text-xl text-gray-400 font-bold uppercase tracking-widest">Booklet is empty</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                  {getBookletCards(viewingBookletPlayer).map((card, idx) => (
                    <motion.div 
                      key={`${card.id}-${idx}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="relative group rounded-xl overflow-hidden bg-[#181822] border border-white/10 hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all"
                    >
                      <div className="w-full pt-[139%] relative">
                        <img 
                          src={card.pokemon?.images?.large || card.pokemon?.images?.small || ''}
                          alt={card.pokemon?.name || 'Pokemon Card'}
                          className="absolute inset-0 w-full h-full object-contain p-2 drop-shadow-xl"
                          loading="lazy"
                        />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent flex justify-between items-end">
                        <span className="text-xs font-bold text-white truncate pr-2">{card.pokemon?.name}</span>
                        <span className="text-xs font-mono text-amber-400 font-bold shrink-0">${(card.value || 0).toFixed(2)}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Binder Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <BinderExportModal
            bookletCards={getBookletCards(localPlayer)}
            setName={setName}
            onLeave={onLeave}
            onCancel={() => setShowExportModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
    </ErrorBoundary>
  );
};
