import React from 'react';
import type { Card, Binder } from './types';
import { FolderInput, X, Crown, Layers } from 'lucide-react';
import { getCardImageUrl } from '../../services/tcgdex';

interface Props {
  isOpen: boolean;
  card: Card | null;
  binders: Binder[];
  currentBinderId: string;
  onClose: () => void;
  onMoveCard: (cardId: string, targetBinderId: string) => void;
}

export const MoveCardModal: React.FC<Props> = ({
  isOpen,
  card,
  binders,
  currentBinderId,
  onClose,
  onMoveCard,
}) => {
  if (!isOpen || !card) return null;

  const handleSelectBinder = (targetBinderId: string) => {
    if (targetBinderId === currentBinderId) return;
    onMoveCard(card.id, targetBinderId);
    onClose();
  };

  const currentBinder = binders.find(b => b.id === currentBinderId) || { name: 'My Binder', id: 'my-collection' };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#121218] border border-white/15 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#181822] border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <FolderInput className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Move Card to Binder</h3>
              <p className="text-[11px] text-gray-400">Select destination binder</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Preview Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500/10 via-purple-500/5 to-blue-500/10 border-b border-white/10 flex items-center gap-3.5 shrink-0">
          <div className="w-12 h-16 rounded-md overflow-hidden bg-black/40 border border-white/20 shrink-0 shadow-md">
            <img
              src={getCardImageUrl(card.imageUrl, 'low')}
              alt={card.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-white truncate">{card.name}</div>
            <div className="text-xs text-gray-400 mt-0.5">{card.setName} · #{card.setNumber}</div>
            <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-medium text-amber-300">
              <span>Current:</span>
              <span className="font-bold text-white truncate">{currentBinder.name}</span>
            </div>
          </div>
        </div>

        {/* Binders Selection List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar min-h-0">
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
            Available Binders ({binders.length})
          </div>
          {binders.map((binder) => {
            const isCurrent = binder.id === currentBinderId;
            return (
              <button
                key={binder.id}
                disabled={isCurrent}
                onClick={() => handleSelectBinder(binder.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group ${
                  isCurrent
                    ? 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed'
                    : 'bg-[#181822] hover:bg-[#20202c] border-white/10 hover:border-amber-400/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    binder.isMasterSet
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                  }`}>
                    {binder.isMasterSet ? <Crown className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                        {binder.name}
                      </span>
                      {binder.isMasterSet && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                          MASTER
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      {binder.count || 0} cards · ${Number(binder.value || 0).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 ml-2">
                  {isCurrent ? (
                    <span className="text-[10px] font-bold text-gray-500 px-2 py-1 rounded bg-black/30">
                      Current
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-amber-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Move Here &rarr;
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#181822] border-t border-white/10 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveCardModal;
