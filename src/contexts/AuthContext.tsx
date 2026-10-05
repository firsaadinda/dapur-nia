import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<User>;
  signUp: (name: string, email: string, pass: string) => Promise<User>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_AUTH_KEY = 'dapur_nia_simulated_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Local fallback simulation when Firebase auth is not configured or in offline mode
      try {
        const saved = localStorage.getItem(LOCAL_AUTH_KEY);
        if (saved) {
          setUser(JSON.parse(saved) as User);
        }
      } catch (err) {
        console.warn('Error reading local simulated user:', err);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  const signIn = async (email: string, pass: string): Promise<User> => {
    if (auth) {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
      setUser(credential.user);
      return credential.user;
    } else {
      // Offline simulated user
      const mockUser = {
        uid: `sim_${Date.now()}`,
        email: email.trim(),
        displayName: email.split('@')[0],
      } as unknown as User;
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(mockUser));
      setUser(mockUser);
      return mockUser;
    }
  };

  const signUp = async (name: string, email: string, pass: string): Promise<User> => {
    if (auth) {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (name.trim()) {
        await updateProfile(credential.user, {
          displayName: name.trim(),
        });
      }
      setUser(credential.user);
      return credential.user;
    } else {
      // Offline simulated user
      const mockUser = {
        uid: `sim_${Date.now()}`,
        email: email.trim(),
        displayName: name.trim() || email.split('@')[0],
      } as unknown as User;
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(mockUser));
      setUser(mockUser);
      return mockUser;
    }
  };

  const signOutUser = async (): Promise<void> => {
    if (auth) {
      await signOut(auth);
    }
    localStorage.removeItem(LOCAL_AUTH_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
