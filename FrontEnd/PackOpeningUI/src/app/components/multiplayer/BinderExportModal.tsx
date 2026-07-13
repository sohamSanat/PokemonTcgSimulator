import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, Check, Save } from 'lucide-react';
import { saveCollectedCard } from '../binder/types';

interface BinderExportModalProps {
  bookletCards: any[];
  setName: string;
  onLeave: () => void;
  onCancel: () => void;
}

export const BinderExportModal: React.FC<BinderExportModalProps> = ({ bookletCards, setName, onLeave, onCancel }) => {
  const [selectedCards, setSelectedCards] = useState<string[]>([]);

  const handleSelect = (cardId: string) => {
    if (selectedCards.includes(cardId)) {
      setSelectedCards(selectedCards.filter(id => id !== cardId));
    } else if (selectedCards.length < 3) {
      setSelectedCards([...selectedCards, cardId]);
    }
  };

  const handleSaveAndLeave = () => {
    // Save selected cards to binder
    selectedCards.forEach(cardId => {
      const card = bookletCards.find(c => c.id === cardId);
      if (card) {
        saveCollectedCard(card, setName, 'my-collection');
      }
    });
    onLeave();
  };

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-8">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#14141c] border-2 border-amber-500/30 rounded-3xl p-8 max-w-4xl w-full flex flex-col shadow-[0_0_100px_rgba(245,158,11,0.2)] max-h-full"
      >
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div>
            <h2 className="text-3xl font-black text-amber-400">Export to Binder</h2>
            <p className="text-gray-400 mt-1">Select up to 3 cards to keep from this session.</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-2xl font-black text-white">{selectedCards.length} / 3</span>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Selected</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[300px] mb-6 custom-scrollbar pr-2">
          {bookletCards.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 font-bold uppercase tracking-widest">No cards pulled yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {bookletCards.map((card, idx) => {
                const isSelected = selectedCards.includes(card.id);
                const isMaxed = !isSelected && selectedCards.length >= 3;
                
                return (
                  <motion.div 
                    key={`${card.id}-${idx}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    onClick={() => !isMaxed && handleSelect(card.id)}
                    className={`relative group rounded-xl overflow-hidden bg-[#181822] border-2 transition-all ${
                      isSelected 
                        ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)] scale-[1.02]' 
                        : isMaxed 
                          ? 'border-white/5 opacity-50 cursor-not-allowed' 
                          : 'border-white/10 hover:border-amber-500/50 cursor-pointer'
                    }`}
                  >
                    <div className="w-full pt-[139%] relative">
                      <img 
                        src={card.pokemon?.images?.large || card.pokemon?.images?.small || ''}
                        alt={card.pokemon?.name || 'Pokemon Card'}
                        className="absolute inset-0 w-full h-full object-contain p-2 drop-shadow-xl"
                        loading="lazy"
                      />
                    </div>
                    {isSelected && (
                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center backdrop-blur-[1px]">
                        <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                          <Check className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4 shrink-0">
          <button 
            onClick={onCancel}
            className="px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSaveAndLeave}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-black px-8 py-3 rounded-xl font-black uppercase tracking-wider hover:scale-105 transition-transform shadow-[0_0_20px_rgba(245,158,11,0.3)]"
          >
            <Save className="w-5 h-5" />
            {selectedCards.length > 0 ? 'Save & Leave' : 'Leave Without Saving'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
