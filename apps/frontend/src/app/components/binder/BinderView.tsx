import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Loader2 } from 'lucide-react';
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import Sidebar from "./Sidebar";
import BinderPage from "./BinderPage";
import CreateBinderModal from "./CreateBinderModal";
import MoveCardModal from "./MoveCardModal";
import { getBinders, saveBinders, getCollectedCards, getStorageKey, SAMPLE_CARDS, moveCardToBinder, type Card, type Binder } from "./types";

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
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"price-desc" | "price-asc" | "name" | "rarity" | "newest">("price-desc");
  const [holofoilOnly, setHolofoilOnly] = useState<boolean>(false);
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [collectedCards, setCollectedCards] = useState<Card[]>([]);
  const [isSimulatingLoad, setIsSimulatingLoad] = useState<boolean>(true);
  const [movingCard, setMovingCard] = useState<Card | null>(null);

  useEffect(() => {
    setIsSimulatingLoad(false);
  }, []);

  const refreshData = useCallback(() => {
    setCollectedCards(getCollectedCards());
    setBinders(getBinders());
  }, []);

  const handleOpenMoveCardModal = useCallback((card: Card) => {
    setMovingCard(card);
  }, []);

  const handleConfirmMoveCard = useCallback((cardId: string, targetBinderId: string) => {
    moveCardToBinder(cardId, targetBinderId);
    refreshData();
  }, [refreshData]);

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

  const typesList = useMemo(() => {
    const types = new Set<string>(["All Types"]);
    rawCards.forEach(c => c.type && types.add(c.type));
    return Array.from(types);
  }, [rawCards]);

  const raritiesList = useMemo(() => {
    const defaultList = ["All Rarities", "Common", "Uncommon", "Rare", "Ultra / Secret Rare", "Illustration Rare", "Promo", "Shiny Vault"];
    const set = new Set<string>(defaultList);
    rawCards.forEach(c => c.rarity && set.add(c.rarity));
    return Array.from(set);
  }, [rawCards]);

  const filteredCards = useMemo(() => {
    return rawCards.filter(card => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = card.name.toLowerCase().includes(q);
        const matchesSet = card.setName?.toLowerCase().includes(q);
        const matchesNumber = card.setNumber?.toLowerCase().includes(q);
        const matchesRarity = card.rarity?.toLowerCase().includes(q);
        if (!matchesName && !matchesSet && !matchesNumber && !matchesRarity) return false;
      }

      // Set filter
      if (activeSetFilter !== "All Sets" && card.setName !== activeSetFilter) return false;

      // Type filter
      if (activeTypeFilter !== "All Types" && card.type !== activeTypeFilter) return false;

        // Rarity filter
        if (activeRarityFilter !== "All Rarities") {
          const cRarity = (card.rarity || "").toLowerCase();
          const fRarity = activeRarityFilter.toLowerCase();

          if (fRarity === "sir" || fRarity.includes("special illustration") || fRarity.includes("sir")) {
            const isSir = cRarity.includes("special illustration") || cRarity === "sir" || cRarity === "sar" || cRarity.includes("special art");
            if (!isSir) return false;
          } else if (fRarity === "sr" || fRarity.includes("secret rare") || fRarity === "secret") {
            const isSr = (cRarity.includes("secret") || cRarity === "sr" || cRarity.includes("super rare")) && !cRarity.includes("special illustration");
            if (!isSr) return false;
          } else if (fRarity === "ur" || fRarity.includes("ultra rare")) {
            const isUr = cRarity.includes("ultra") || cRarity === "ur" || cRarity.includes("double rare") || cRarity.includes("hyper rare") || cRarity.includes("vmax") || cRarity.includes("vstar") || (cRarity.includes("ex") && !cRarity.includes("special illustration"));
            if (!isUr) return false;
          } else if (fRarity === "ir" || fRarity.includes("illustration rare")) {
            const isIr = (cRarity.includes("illustration") || cRarity === "ir" || cRarity.includes("art rare") || cRarity === "ar") && !cRarity.includes("special illustration");
            if (!isIr) return false;
          } else if (fRarity === "common") {
            if (!cRarity.includes("common")) return false;
          } else if (fRarity === "uncommon") {
            if (!cRarity.includes("uncommon")) return false;
          } else if (fRarity === "rare") {
            if (!cRarity.includes("rare") || cRarity.includes("ultra") || cRarity.includes("secret") || cRarity.includes("illustration") || cRarity.includes("special")) return false;
          } else if (fRarity.includes("promo")) {
            if (!cRarity.includes("promo") && !card.id.toLowerCase().includes("promo")) return false;
          } else if (fRarity.includes("shiny vault")) {
            if (!cRarity.includes("shiny vault") && !cRarity.includes("shiny")) return false;
          } else {
            // Exact or partial match for custom rarity strings
            if (card.rarity !== activeRarityFilter && !cRarity.includes(fRarity)) return false;
          }
        }

      // Holofoil filter
      if (holofoilOnly && !card.holofoil) return false;

      // Favorites filter
      if (favoritesOnly && !card.favorite) return false;

      return true;
    });
  }, [rawCards, searchQuery, activeSetFilter, activeRarityFilter, activeTypeFilter, holofoilOnly, favoritesOnly]);

  const sortedCards = useMemo(() => {
    const list = [...filteredCards];
    if (sortBy === "price-desc") {
      list.sort((a, b) => (b.currentPrice || 0) - (a.currentPrice || 0));
    } else if (sortBy === "price-asc") {
      list.sort((a, b) => (a.currentPrice || 0) - (b.currentPrice || 0));
    } else if (sortBy === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "rarity") {
      const rarityRank = (r: string) => {
        const lr = (r || "").toLowerCase();
        if (lr.includes("secret") || lr.includes("hyper") || lr.includes("special illustration")) return 5;
        if (lr.includes("ultra") || lr.includes("illustration") || lr.includes("double")) return 4;
        if (lr.includes("rare")) return 3;
        if (lr.includes("uncommon")) return 2;
        return 1;
      };
      list.sort((a, b) => rarityRank(b.rarity) - rarityRank(a.rarity));
    }
    return list;
  }, [filteredCards, sortBy]);

  const pageSize = 9;
  const totalPages = Math.ceil(sortedCards.length / pageSize) || 1;
  const paginatedCards = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedCards.slice(start, start + pageSize);
  }, [sortedCards, currentPage]);

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
  const handleSearchQueryChange = useCallback((q: string) => { setSearchQuery(q); setCurrentPage(1); }, []);
  const handleSortByChange = useCallback((s: "price-desc" | "price-asc" | "name" | "rarity" | "newest") => { setSortBy(s); setCurrentPage(1); }, []);
  const handleResetFilters = useCallback(() => {
    setActiveRarityFilter("All Rarities");
    setActiveSetFilter("All Sets");
    setActiveTypeFilter("All Types");
    setHolofoilOnly(false);
    setFavoritesOnly(false);
    setSearchQuery("");
    setSortBy("price-desc");
    setCurrentPage(1);
  }, []);

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
        raritiesList={raritiesList}
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
            totalCardsInBinder={sortedCards.length}
            onInspectCard={onInspectCard}
            onMoveCard={handleOpenMoveCardModal}
            currentBinderObj={currentBinderObj}
            activeRarityFilter={activeRarityFilter}
            onRarityFilterChange={handleRarityFilterChange}
            raritiesList={raritiesList}
            activeSetFilter={activeSetFilter}
            onSetFilterChange={handleSetFilterChange}
            setsList={setsList}
            activeTypeFilter={activeTypeFilter}
            onTypeFilterChange={handleTypeFilterChange}
            typesList={typesList}
            holofoilOnly={holofoilOnly}
            onToggleHolofoil={handleToggleHolofoil}
            favoritesOnly={favoritesOnly}
            onToggleFavorites={handleToggleFavorites}
            searchQuery={searchQuery}
            onSearchQueryChange={handleSearchQueryChange}
            sortBy={sortBy}
            onSortByChange={handleSortByChange}
            onResetFilters={handleResetFilters}
          />
        </DndContext>
      )}

      <CreateBinderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateBinder={handleCreateBinder}
      />

      <MoveCardModal
        isOpen={Boolean(movingCard)}
        card={movingCard}
        binders={binders}
        currentBinderId={activeBinder}
        onClose={() => setMovingCard(null)}
        onMoveCard={handleConfirmMoveCard}
      />
    </div>
  );
}
