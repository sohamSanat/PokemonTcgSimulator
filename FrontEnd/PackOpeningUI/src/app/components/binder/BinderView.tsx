import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Loader2 } from 'lucide-react';
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import Sidebar from "./Sidebar";
import BinderPage from "./BinderPage";
import CreateBinderModal from "./CreateBinderModal";
import { getBinders, saveBinders, getCollectedCards, getStorageKey, SAMPLE_CARDS, type Card, type Binder } from "./types";

interface Props {
  onSwitchToPacks?: () => void;
  onInspectCard?: (card: Card) => void;
}

export default function BinderView({ onSwitchToPacks, onInspectCard }: Props) {
  const [binders, setBinders] = useState<Binder[]>([]);
  const [activeBinder, setActiveBinder] = useState<string>("my-collection");
  const [activeSetFilter, setActiveSetFilter] = useState<string>("All Sets");
  const [activeRarityFilter, setActiveRarityFilter] = useState<string>("All Rarities");
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>("All Types");
  const [holofoilOnly, setHolofoilOnly] = useState<boolean>(false);
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [collectedCards, setCollectedCards] = useState<Card[]>([]);
  const [isSimulatingLoad, setIsSimulatingLoad] = useState<boolean>(true);

  useEffect(() => {
    // Simulate loading cards and fetching prices when the binder section is first clicked
    const t = setTimeout(() => {
      setIsSimulatingLoad(false);
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  const refreshData = useCallback(() => {
    setCollectedCards(getCollectedCards());
    setBinders(getBinders());
  }, []);

  useEffect(() => {
    refreshData();
    const handleStorage = () => refreshData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [refreshData, activeBinder]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const handleOpenNewBinderModal = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  const handleCreateBinder = useCallback((data: {
    name: string;
    isMasterSet?: boolean;
    masterSetId?: string;
    masterSetName?: string;
    totalCardsInSet?: number;
    generation?: string;
  }) => {
    const newId = `binder-${Date.now()}`;
    const newBinder: Binder = {
      id: newId,
      name: data.name,
      count: 0,
      value: 0,
      isCustom: true,
      isMasterSet: data.isMasterSet,
      masterSetId: data.masterSetId,
      masterSetName: data.masterSetName,
      totalCardsInSet: data.totalCardsInSet,
      generation: data.generation,
    };
    const updated = [...binders, newBinder];
    setBinders(updated);
    saveBinders(updated);
    setActiveBinder(newId);
    setCurrentPage(1);
  }, [binders]);

  const handleToggleFavorite = useCallback((id: string) => {
    setCollectedCards(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, favorite: !c.favorite } : c);
      localStorage.setItem(getStorageKey("tcg_my_collection"), JSON.stringify(updated));
      return updated;
    });
  }, []);

  const rawCards = useMemo(() => {
    if (activeBinder === "my-collection") {
      return collectedCards.filter(c => !c.binderId || c.binderId === "my-collection");
    }
    return collectedCards.filter(c => c.binderId === activeBinder);
  }, [activeBinder, collectedCards]);

  const setsList = useMemo(() => {
    const sets = new Set<string>(["All Sets"]);
    rawCards.forEach(c => c.setName && sets.add(c.setName));
    return Array.from(sets);
  }, [rawCards]);

  const filteredCards = useMemo(() => {
    return rawCards.filter(card => {
      if (activeSetFilter !== "All Sets" && card.setName !== activeSetFilter) return false;
      if (activeRarityFilter !== "All Rarities" && card.rarity !== activeRarityFilter) return false;
      if (activeTypeFilter !== "All Types" && card.type !== activeTypeFilter) return false;
      if (holofoilOnly && !card.holofoil) return false;
      if (favoritesOnly && !card.favorite) return false;
      return true;
    });
  }, [rawCards, activeSetFilter, activeRarityFilter, activeTypeFilter, holofoilOnly, favoritesOnly]);

  const pageSize = 9;
  const totalPages = Math.ceil(filteredCards.length / pageSize) || 1;
  const paginatedCards = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCards.slice(start, start + pageSize);
  }, [filteredCards, currentPage]);

  const currentBinderObj: Binder = binders.find(b => b.id === activeBinder) || binders[0] || { id: "my-collection", name: "My Binder", count: 0, value: 0, isCustom: false };

  const totalPortfolioValue = useMemo(() => {
    return binders.reduce((sum, b) => sum + (b.value || 0), 0);
  }, [binders]);

  const totalCardsCount = useMemo(() => {
    return binders.reduce((sum, b) => sum + (b.count || 0), 0);
  }, [binders]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id && over?.id) {
      setCollectedCards(prev => {
        const oldGlobalIndex = prev.findIndex(c => c.id === active.id);
        const newGlobalIndex = prev.findIndex(c => c.id === over.id);
        if (oldGlobalIndex !== -1 && newGlobalIndex !== -1) {
          const updated = arrayMove(prev, oldGlobalIndex, newGlobalIndex);
          localStorage.setItem(getStorageKey("tcg_my_collection"), JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    }
  }, []);

  const handleClearBinder = useCallback(() => {
    if (window.confirm(`Are you sure you want to clear all cards from "${currentBinderObj.name}"?`)) {
      setCollectedCards(prev => {
        const updated = prev.filter(c => {
          if (activeBinder === "my-collection") {
            return c.binderId && c.binderId !== "my-collection";
          }
          return c.binderId !== activeBinder;
        });
        localStorage.setItem(getStorageKey("tcg_my_collection"), JSON.stringify(updated));
        return updated;
      });
      const b = getBinders();
      setBinders(b);
      saveBinders(b);
    }
  }, [currentBinderObj.name, activeBinder]);

  const handleDeleteBinder = useCallback((binderId?: string) => {
    const idToDelete = binderId || activeBinder;
    if (idToDelete === "my-collection") {
      alert("You cannot delete the default 'My Collection (Opened)' binder, but you can clear its cards.");
      return;
    }
    const targetBinder = binders.find(b => b.id === idToDelete);
    if (!targetBinder) return;

    if (window.confirm(`Are you sure you want to permanently delete the binder "${targetBinder.name}" and remove all ${targetBinder.count || 0} cards inside it?`)) {
      setCollectedCards(prev => {
        const updatedCards = prev.filter(c => c.binderId !== idToDelete);
        localStorage.setItem(getStorageKey("tcg_my_collection"), JSON.stringify(updatedCards));
        return updatedCards;
      });

      const updatedBinders = binders.filter(b => b.id !== idToDelete);
      setBinders(updatedBinders);
      saveBinders(updatedBinders);

      if (activeBinder === idToDelete) {
        setActiveBinder("my-collection");
        setCurrentPage(1);
      }
    }
  }, [activeBinder, binders]);

  const handleSelectBinder = useCallback((id: string) => { setActiveBinder(id); setCurrentPage(1); }, []);
  const handleSetFilterChange = useCallback((s: string) => { setActiveSetFilter(s); setCurrentPage(1); }, []);
  const handleRarityFilterChange = useCallback((r: string) => { setActiveRarityFilter(r); setCurrentPage(1); }, []);
  const handleTypeFilterChange = useCallback((t: string) => { setActiveTypeFilter(t); setCurrentPage(1); }, []);
  const handleToggleHolofoil = useCallback(() => { setHolofoilOnly(prev => !prev); setCurrentPage(1); }, []);
  const handleToggleFavorites = useCallback(() => { setFavoritesOnly(prev => !prev); setCurrentPage(1); }, []);
  const handleAddCard = useCallback(() => { if (onSwitchToPacks) onSwitchToPacks(); }, [onSwitchToPacks]);
  const handleDeleteActiveBinder = useCallback(() => { handleDeleteBinder(activeBinder); }, [handleDeleteBinder, activeBinder]);

  return (
    <div className="flex flex-col md:flex-row w-full flex-1 h-full bg-[#0d0d0f] text-[#f0f0f2] overflow-y-auto md:overflow-hidden min-h-0 custom-scrollbar">
      <Sidebar
        binders={binders}
        activeBinder={activeBinder}
        onSelectBinder={handleSelectBinder}
        onNewBinder={handleOpenNewBinderModal}
        onDeleteBinder={handleDeleteBinder}
        activeSetFilter={activeSetFilter}
        onSetFilterChange={handleSetFilterChange}
        activeRarityFilter={activeRarityFilter}
        onRarityFilterChange={handleRarityFilterChange}
        activeTypeFilter={activeTypeFilter}
        onTypeFilterChange={handleTypeFilterChange}
        holofoilOnly={holofoilOnly}
        onToggleHolofoil={handleToggleHolofoil}
        favoritesOnly={favoritesOnly}
        onToggleFavorites={handleToggleFavorites}
        totalCardsCount={totalCardsCount}
        totalPortfolioValue={totalPortfolioValue}
        setsList={setsList}
      />
      {isSimulatingLoad ? (
        <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#0d0d0f] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a24] to-[#0d0d0f] opacity-50 z-0"></div>
          <Loader2 className="w-12 h-12 animate-spin text-amber-500 mb-6 z-10" />
          <h2 className="text-xl font-bold text-white mb-2 z-10">Fetching Collection Data</h2>
          <p className="text-sm text-gray-400 z-10">Syncing live market prices...</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <BinderPage
            binderName={currentBinderObj.name}
            cards={paginatedCards}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onToggleFavorite={handleToggleFavorite}
            onAddCard={handleAddCard}
            onClearBinder={handleClearBinder}
            onDeleteBinder={activeBinder !== "my-collection" ? handleDeleteActiveBinder : undefined}
            totalCardsInBinder={filteredCards.length}
            onInspectCard={onInspectCard}
            currentBinderObj={currentBinderObj}
          />
        </DndContext>
      )}

      <CreateBinderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateBinder={handleCreateBinder}
      />
    </div>
  );
}
