import React, { useState, useEffect, useMemo, useCallback } from "react";
import Sidebar from "./Sidebar";
import BinderPage from "./BinderPage";
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

  const handleNewBinder = useCallback(() => {
    const name = window.prompt("Enter a name for your new binder:", "New Binder");
    if (!name || !name.trim()) return;
    const newId = `binder-${Date.now()}`;
    const newBinder: Binder = {
      id: newId,
      name: name.trim(),
      count: 0,
      value: 0,
      isCustom: true
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
    <div className="flex flex-col md:flex-row w-full flex-1 h-full bg-[#0d0d0f] text-[#f0f0f2] overflow-hidden min-h-0">
      <Sidebar
        binders={binders}
        activeBinder={activeBinder}
        onSelectBinder={handleSelectBinder}
        onNewBinder={handleNewBinder}
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
      />
    </div>
  );
}
