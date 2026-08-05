import React, { createContext, useContext, useState, useEffect } from 'react';
import { sound } from '../services/sound';
import { CardData } from '../utils/packUtils';
import { getRemainingLuckyDropSeconds, claimLuckyDropReward, LuckyDropReward } from '../services/luckyDrop';

export type TabType = 'pack' | 'binder' | 'psa' | 'ripNship' | 'multiplayerLobby' | 'multiplayerArena' | 'cardShow' | 'missions' | 'auctions' | 'profile';

interface AppUIContextType {
  activeTab: TabType;
  setActiveTab: React.Dispatch<React.SetStateAction<TabType>>;
  
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  
  isInventoryOpen: boolean;
  setIsInventoryOpen: React.Dispatch<React.SetStateAction<boolean>>;
  
  soundEnabled: boolean;
  setSoundEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  
  inspectedCard: CardData | null;
  setInspectedCard: React.Dispatch<React.SetStateAction<CardData | null>>;
  
  inspectedViewMode: 'market' | 'art';
  setInspectedViewMode: React.Dispatch<React.SetStateAction<'market' | 'art'>>;
  
  tradeTarget: any;
  setTradeTarget: React.Dispatch<React.SetStateAction<any>>;

  luckyDropSeconds: number;
  setLuckyDropSeconds: React.Dispatch<React.SetStateAction<number>>;
  
  claimedLuckyPack: LuckyDropReward | null;
  setClaimedLuckyPack: React.Dispatch<React.SetStateAction<LuckyDropReward | null>>;
  
  isLuckyDropModalOpen: boolean;
  setIsLuckyDropModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  
  purchaseTargetSet: any | null;
  setPurchaseTargetSet: React.Dispatch<React.SetStateAction<any | null>>;
  
  unboxingBoxTarget: {
    set: any;
    boxType: 'halfBox' | 'fullBox';
    action: 'rip' | 'vault';
  } | null;
  setUnboxingBoxTarget: React.Dispatch<React.SetStateAction<{ set: any; boxType: 'halfBox' | 'fullBox'; action: 'rip' | 'vault'; } | null>>;

  showOutofPassesModal: boolean;
  setShowOutofPassesModal: React.Dispatch<React.SetStateAction<boolean>>;
  
  showInsufficientCashModal: boolean;
  setShowInsufficientCashModal: React.Dispatch<React.SetStateAction<boolean>>;
  
  showPriceGateModal: boolean;
  setShowPriceGateModal: React.Dispatch<React.SetStateAction<boolean>>;
  
  priceGateCost: number;
  setPriceGateCost: React.Dispatch<React.SetStateAction<number>>;
}

const AppUIContext = createContext<AppUIContextType | undefined>(undefined);

export const AppUIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabType>('pack');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(sound.isEnabled());
  
  const [inspectedCard, setInspectedCard] = useState<CardData | null>(null);
  const [inspectedViewMode, setInspectedViewMode] = useState<'market' | 'art'>('market');
  const [tradeTarget, setTradeTarget] = useState<any>(null);

  const [luckyDropSeconds, setLuckyDropSeconds] = useState(() => getRemainingLuckyDropSeconds());
  const [claimedLuckyPack, setClaimedLuckyPack] = useState<LuckyDropReward | null>(null);
  const [isLuckyDropModalOpen, setIsLuckyDropModalOpen] = useState(false);
  
  const [purchaseTargetSet, setPurchaseTargetSet] = useState<any | null>(null);
  const [unboxingBoxTarget, setUnboxingBoxTarget] = useState<{ set: any; boxType: 'halfBox' | 'fullBox'; action: 'rip' | 'vault'; } | null>(null);

  const [showOutofPassesModal, setShowOutofPassesModal] = useState(false);
  const [showInsufficientCashModal, setShowInsufficientCashModal] = useState(false);
  const [showPriceGateModal, setShowPriceGateModal] = useState(false);
  const [priceGateCost, setPriceGateCost] = useState(0);

  useEffect(() => {
    const updateLuckyTimer = () => setLuckyDropSeconds(getRemainingLuckyDropSeconds());
    updateLuckyTimer();
    const interval = setInterval(updateLuckyTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppUIContext.Provider value={{
      activeTab, setActiveTab,
      isMobileMenuOpen, setIsMobileMenuOpen,
      isInventoryOpen, setIsInventoryOpen,
      soundEnabled, setSoundEnabled,
      inspectedCard, setInspectedCard,
      inspectedViewMode, setInspectedViewMode,
      tradeTarget, setTradeTarget,
      luckyDropSeconds, setLuckyDropSeconds,
      claimedLuckyPack, setClaimedLuckyPack,
      isLuckyDropModalOpen, setIsLuckyDropModalOpen,
      purchaseTargetSet, setPurchaseTargetSet,
      unboxingBoxTarget, setUnboxingBoxTarget,
      showOutofPassesModal, setShowOutofPassesModal,
      showInsufficientCashModal, setShowInsufficientCashModal,
      showPriceGateModal, setShowPriceGateModal,
      priceGateCost, setPriceGateCost
    }}>
      {children}
    </AppUIContext.Provider>
  );
};

export const useAppUI = () => {
  const context = useContext(AppUIContext);
  if (context === undefined) {
    throw new Error('useAppUI must be used within an AppUIProvider');
  }
  return context;
};
