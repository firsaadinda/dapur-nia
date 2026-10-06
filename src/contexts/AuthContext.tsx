import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<User>;
  signUp: (name: string, email: string, pass: string, role?: UserRole) => Promise<User>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_AUTH_KEY = 'dapur_nia_simulated_user';
const LOCAL_ROLE_KEY = 'dapur_nia_simulated_role';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('pemilik');
  const [loading, setLoading] = useState(true);

  // Helper to fetch user role from Firestore
  const fetchUserRole = async (currentUser: User): Promise<UserRole> => {
    // If user email or display name indicates staff
    if (currentUser.email?.toLowerCase().includes('staf') || currentUser.email?.toLowerCase().includes('rani')) {
      return 'staf';
    }

    if (db) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const snapshot = await getDoc(userDocRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data?.role === 'staf' || data?.role === 'pemilik') {
            return data.role;
          }
        }
      } catch (err) {
        console.warn('Gagal membaca role pengguna dari Firestore:', err);
      }
    }

    // Default role is pemilik
    return 'pemilik';
  };

  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          const userRole = await fetchUserRole(currentUser);
          setRole(userRole);
        } else {
          setRole('pemilik');
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Local fallback simulation when Firebase auth is not configured or in offline mode
      try {
        const savedUser = localStorage.getItem(LOCAL_AUTH_KEY);
        const savedRole = (localStorage.getItem(LOCAL_ROLE_KEY) as UserRole) || 'pemilik';
        if (savedUser) {
          setUser(JSON.parse(savedUser) as User);
          setRole(savedRole);
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
      const userRole = await fetchUserRole(credential.user);
      setRole(userRole);
      return credential.user;
    } else {
      // Offline simulated user
      const isStaff = email.toLowerCase().includes('staf') || email.toLowerCase().includes('rani');
      const simulatedRole: UserRole = isStaff ? 'staf' : 'pemilik';
      const mockUser = {
        uid: `sim_${Date.now()}`,
        email: email.trim(),
        displayName: email.split('@')[0],
      } as unknown as User;

      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(mockUser));
      localStorage.setItem(LOCAL_ROLE_KEY, simulatedRole);
      setUser(mockUser);
      setRole(simulatedRole);
      return mockUser;
    }
  };

  const signUp = async (
    name: string,
    email: string,
    pass: string,
    chosenRole: UserRole = 'pemilik'
  ): Promise<User> => {
    if (auth) {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (name.trim()) {
        await updateProfile(credential.user, {
          displayName: name.trim(),
        });
      }

      // Simpan role dan profil pengguna ke koleksi users di Firestore
      if (db) {
        try {
          await setDoc(doc(db, 'users', credential.user.uid), {
            uid: credential.user.uid,
            name: name.trim(),
            email: email.trim(),
            role: chosenRole,
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          console.warn('Gagal menyimpan profil pengguna ke Firestore:', err);
        }
      }

      setUser(credential.user);
      setRole(chosenRole);
      return credential.user;
    } else {
      // Offline simulated user
      const mockUser = {
        uid: `sim_${Date.now()}`,
        email: email.trim(),
        displayName: name.trim() || email.split('@')[0],
      } as unknown as User;

      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(mockUser));
      localStorage.setItem(LOCAL_ROLE_KEY, chosenRole);
      setUser(mockUser);
      setRole(chosenRole);
      return mockUser;
    }
  };

  const signOutUser = async (): Promise<void> => {
    if (auth) {
      await signOut(auth);
    }
    localStorage.removeItem(LOCAL_AUTH_KEY);
    localStorage.removeItem(LOCAL_ROLE_KEY);
    setUser(null);
    setRole('pemilik');
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signUp, signOutUser }}>
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
