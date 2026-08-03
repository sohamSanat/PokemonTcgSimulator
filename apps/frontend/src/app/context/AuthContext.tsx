import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If auth is not initialized, stop loading
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setCurrentUser(user);
        if (user?.email?.toLowerCase() === 'admin@gmail.com') {
          localStorage.setItem('is_admin_mode', 'true');
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new CustomEvent('daily_cash_updated', { detail: 999999999 }));
        }
        
        // Import store directly to avoid circular ESM export issues with types.ts
        try {
          const storeModule = await import('../components/binder/store');
          if (storeModule && typeof storeModule.listenToFirestore === 'function') {
            storeModule.listenToFirestore(user ? user.uid : null);
          }
        } catch (e) {
          console.error('Failed to initialize listenToFirestore:', e);
        }
      } catch (err) {
        console.error('Auth state change error:', err);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
