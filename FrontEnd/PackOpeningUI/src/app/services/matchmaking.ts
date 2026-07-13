import { doc, setDoc, updateDoc, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface PlayerState {
  uid: string;
  displayName: string;
  isReady: boolean;
  packProgress: number;
  revealedIndex: number;
  cards: any[]; // Store generated cards so both players see the same cards for a given pack
}

export interface MatchState {
  id: string;
  status: 'waiting' | 'ready' | 'playing' | 'finished';
  player1: PlayerState | null;
  player2: PlayerState | null;
  packId: string; // The type of pack they are opening (e.g. swsh3)
  createdAt: any;
}

// Generate a simple 5-character alphanumeric room code
export const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
};

export const createMatch = async (userId: string, displayName: string, packId: string): Promise<string> => {
  const matchId = generateRoomCode();
  const matchRef = doc(db, 'matches', matchId);
  
  const initialMatch: MatchState = {
    id: matchId,
    status: 'waiting',
    packId,
    createdAt: serverTimestamp(),
    player1: {
      uid: userId,
      displayName,
      isReady: false,
      packProgress: 0,
      revealedIndex: -1,
      cards: []
    },
    player2: null
  };

  await setDoc(matchRef, initialMatch);
  return matchId;
};

export const joinMatch = async (matchId: string, userId: string, displayName: string): Promise<boolean> => {
  const matchRef = doc(db, 'matches', matchId);
  const matchSnap = await getDoc(matchRef);

  if (!matchSnap.exists()) {
    throw new Error("Match not found");
  }

  const matchData = matchSnap.data() as MatchState;
  
  if (matchData.player1?.uid === userId || matchData.player2?.uid === userId) {
    // User is already in the match (rejoining/refreshing page)
    return true; 
  }

  if (matchData.player2 !== null) {
    throw new Error("Match is full");
  }

  await updateDoc(matchRef, {
    player2: {
      uid: userId,
      displayName,
      isReady: false,
      packProgress: 0,
      revealedIndex: -1,
      cards: []
    }
  });

  return true;
};

export const updatePlayerState = async (
  matchId: string, 
  playerSlot: 'player1' | 'player2', 
  updates: Partial<PlayerState>
) => {
  const matchRef = doc(db, 'matches', matchId);
  
  // We construct the update object with dot notation to only update specific fields
  const firestoreUpdates: Record<string, any> = {};
  for (const [key, value] of Object.entries(updates)) {
    firestoreUpdates[`${playerSlot}.${key}`] = value;
  }
  
  await updateDoc(matchRef, firestoreUpdates);
};

export const updateMatchStatus = async (matchId: string, status: MatchState['status']) => {
  const matchRef = doc(db, 'matches', matchId);
  await updateDoc(matchRef, { status });
};

export const subscribeToMatch = (matchId: string, callback: (match: MatchState | null) => void) => {
  const matchRef = doc(db, 'matches', matchId);
  
  return onSnapshot(matchRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as MatchState);
    } else {
      callback(null);
    }
  });
};
