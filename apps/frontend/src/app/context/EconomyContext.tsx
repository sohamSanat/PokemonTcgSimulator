import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { db, onSnapshot, doc, setDoc } from '../services/firebase';
import { getStorageKey } from '../components/binder/types';
import { getDailyFreePacks, getEarnedSetPacks, getOwnedMysteryPacks, EarnedSetPack, OwnedMysteryPack, getDailyCash } from '../services/missions';

interface EconomyContextType {
  sessionTotal: number;
  setSessionTotal: React.Dispatch<React.SetStateAction<number>>;
  packCount: number;
  setPackCount: React.Dispatch<React.SetStateAction<number>>;
  sessionSpent: number;
  setSessionSpent: React.Dispatch<React.SetStateAction<number>>;
  dailyFreePacks: { english: number; japanese: number };
  setDailyFreePacks: React.Dispatch<React.SetStateAction<{ english: number; japanese: number }>>;
  earnedSetPacks: EarnedSetPack[];
  setEarnedSetPacks: React.Dispatch<React.SetStateAction<EarnedSetPack[]>>;
  ownedMysteryPacks: OwnedMysteryPack[];
  setOwnedMysteryPacks: React.Dispatch<React.SetStateAction<OwnedMysteryPack[]>>;
  dailyCash: number;
  setDailyCash: React.Dispatch<React.SetStateAction<number>>;
}

const EconomyContext = createContext<EconomyContextType | undefined>(undefined);

export const EconomyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  
  const [sessionTotal, setSessionTotal] = useState(() => {
    try {
      const saved = localStorage.getItem(getStorageKey('tcg_session_total', currentUser?.uid));
      return saved !== null ? Number(saved) : 0;
    } catch { return 0; }
  });
  const [packCount, setPackCount] = useState(() => {
    try {
      const saved = localStorage.getItem(getStorageKey('tcg_session_pack_count', currentUser?.uid));
      return saved !== null ? Number(saved) : 0;
    } catch { return 0; }
  });
  const [sessionSpent, setSessionSpent] = useState(() => {
    try {
      const saved = localStorage.getItem(getStorageKey('tcg_session_spent', currentUser?.uid));
      return saved !== null ? Number(saved) : 0;
    } catch { return 0; }
  });
  
  const [dailyFreePacks, setDailyFreePacks] = useState(() => getDailyFreePacks());
  const [earnedSetPacks, setEarnedSetPacks] = useState<EarnedSetPack[]>(() => getEarnedSetPacks());
  const [ownedMysteryPacks, setOwnedMysteryPacks] = useState<OwnedMysteryPack[]>(() => getOwnedMysteryPacks());
  const [dailyCash, setDailyCash] = useState<number>(() => getDailyCash());

  const lastSyncedStatsRef = useRef({ sessionTotal: -1, packCount: -1, sessionSpent: -1 });
  const [hasLoadedFromFirebase, setHasLoadedFromFirebase] = useState(false);
  const previousUserRef = useRef<string | undefined | null>(currentUser?.uid);

  useEffect(() => {
    const prevUid = previousUserRef.current;
    if (prevUid !== currentUser?.uid) {
      if (prevUid != null) {
        try {
          const savedTotal = localStorage.getItem(getStorageKey('tcg_session_total', currentUser?.uid));
          setSessionTotal(savedTotal !== null ? Number(savedTotal) : 0);
          
          const savedCount = localStorage.getItem(getStorageKey('tcg_session_pack_count', currentUser?.uid));
          setPackCount(savedCount !== null ? Number(savedCount) : 0);

          const savedSpent = localStorage.getItem(getStorageKey('tcg_session_spent', currentUser?.uid));
          setSessionSpent(savedSpent !== null ? Number(savedSpent) : 0);
        } catch { }
      }
      previousUserRef.current = currentUser?.uid;
      lastSyncedStatsRef.current = { sessionTotal: -1, packCount: -1, sessionSpent: -1 };
      setHasLoadedFromFirebase(false);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!currentUser) return;
    setHasLoadedFromFirebase(false);
    const unsubscribe = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
      setHasLoadedFromFirebase(true);
      if (docSnap.exists()) {
        const rootData = docSnap.data();
        const data = rootData.stats || {};
        const fbTotal = data.sessionTotal ?? rootData.netTotal ?? 0;
        const fbCount = data.packCount ?? 0;
        const fbSpent = data.sessionSpent ?? rootData.netSpent ?? 0;

        lastSyncedStatsRef.current = {
          sessionTotal: fbTotal,
          packCount: fbCount,
          sessionSpent: fbSpent,
        };

        const isMigration = !rootData.stats && !rootData.netTotal;

        setSessionTotal(prev => {
          if (isMigration && fbTotal === 0 && prev > 0) return prev;
          return prev > fbTotal ? prev : fbTotal;
        });
        setPackCount(prev => {
          if (isMigration && fbCount === 0 && prev > 0) return prev;
          return prev > fbCount ? prev : fbCount;
        });
        setSessionSpent(prev => {
          if (isMigration && fbSpent === 0 && prev > 0) return prev;
          return prev > fbSpent ? prev : fbSpent;
        });
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const uid = currentUser?.uid;
    try {
      localStorage.setItem(getStorageKey('tcg_session_total', uid), sessionTotal.toString());
      localStorage.setItem(getStorageKey('tcg_session_pack_count', uid), packCount.toString());
      localStorage.setItem(getStorageKey('tcg_session_spent', uid), sessionSpent.toString());
      window.dispatchEvent(new CustomEvent('user_stats_updated', { detail: { sessionTotal, packCount, sessionSpent } }));
    } catch { }

    if (!uid) return;

    if (hasLoadedFromFirebase) {
      const isFromFirebase =
        sessionTotal === lastSyncedStatsRef.current.sessionTotal &&
        packCount === lastSyncedStatsRef.current.packCount &&
        sessionSpent === lastSyncedStatsRef.current.sessionSpent;

      if (!isFromFirebase) {
        lastSyncedStatsRef.current = { sessionTotal, packCount, sessionSpent };
        setDoc(doc(db, 'users', uid), {
          netTotal: sessionTotal,
          netSpent: sessionSpent,
          stats: {
            sessionTotal,
            packCount,
            sessionSpent,
            lastUpdated: new Date().toISOString()
          }
        }, { merge: true }).catch(err => console.error('Failed to sync stats to Firebase:', err));
      }
    }
  }, [sessionTotal, packCount, sessionSpent, currentUser, hasLoadedFromFirebase]);

  return (
    <EconomyContext.Provider
      value={{
        sessionTotal, setSessionTotal,
        packCount, setPackCount,
        sessionSpent, setSessionSpent,
        dailyFreePacks, setDailyFreePacks,
        earnedSetPacks, setEarnedSetPacks,
        ownedMysteryPacks, setOwnedMysteryPacks,
        dailyCash, setDailyCash,
      }}
    >
      {children}
    </EconomyContext.Provider>
  );
};

export const useEconomy = () => {
  const context = useContext(EconomyContext);
  if (context === undefined) {
    throw new Error('useEconomy must be used within an EconomyProvider');
  }
  return context;
};
