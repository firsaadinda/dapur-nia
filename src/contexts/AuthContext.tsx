import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import type { UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
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

  // Helper to fetch user role from Firestore 'pengguna' collection
  const fetchUserRole = async (currentUser: User): Promise<UserRole> => {
    // If user email or display name indicates staff
    const emailLower = (currentUser.email || '').toLowerCase();
    if (emailLower.includes('staf') || emailLower.includes('rani')) {
      return 'staf';
    }
    if (emailLower.includes('pemilik') || emailLower.includes('nia')) {
      return 'pemilik';
    }

    if (db) {
      try {
        // Cek koleksi 'pengguna'
        const userDocRef = doc(db, 'pengguna', currentUser.uid);
        const snapshot = await getDoc(userDocRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          const roleValue = data?.peran || data?.role;
          if (roleValue === 'staf' || roleValue === 'pemilik') {
            return roleValue;
          }
        }
      } catch (err) {
        console.warn('Gagal membaca role pengguna dari koleksi pengguna:', err);
      }
    }

    // Default role is pemilik (Bu Nia)
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

  const saveToPenggunaDatabase = async (u: User, name: string, chosenRole: UserRole, loginMethod: string) => {
    if (db) {
      try {
        const profileData = {
          id: u.uid,
          nama: name || u.displayName || (chosenRole === 'pemilik' ? 'Bu Nia' : 'Staf Dapur'),
          email: u.email || '',
          peran: chosenRole,
          role: chosenRole,
          metode_masuk: loginMethod,
          status: 'aktif',
          terakhir_masuk: serverTimestamp(),
          dibuat_pada: serverTimestamp(),
        };

        // Simpan ke koleksi 'pengguna' (di bawah pesanan)
        await setDoc(doc(db, 'pengguna', u.uid), profileData, { merge: true });

        // Simpan ke 'users' juga untuk backward compatibility
        await setDoc(doc(db, 'users', u.uid), profileData, { merge: true });
      } catch (err) {
        console.warn('Gagal menyimpan ke koleksi pengguna:', err);
      }
    }
  };

  const signIn = async (email: string, pass: string): Promise<User> => {
    if (auth) {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
      setUser(credential.user);
      const userRole = await fetchUserRole(credential.user);
      setRole(userRole);

      // Simpan jejak masuk ke Firestore pengguna
      await saveToPenggunaDatabase(
        credential.user,
        credential.user.displayName || (userRole === 'pemilik' ? 'Bu Nia' : 'Staf Dapur'),
        userRole,
        'email_password'
      );

      return credential.user;
    } else {
      // Offline simulated user
      const isStaff = email.toLowerCase().includes('staf') || email.toLowerCase().includes('rani');
      const simulatedRole: UserRole = isStaff ? 'staf' : 'pemilik';
      const mockUser = {
        uid: `sim_${Date.now()}`,
        email: email.trim(),
        displayName: isStaff ? 'Rani (Staf Dapur)' : 'Bu Nia',
      } as unknown as User;

      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(mockUser));
      localStorage.setItem(LOCAL_ROLE_KEY, simulatedRole);
      setUser(mockUser);
      setRole(simulatedRole);
      return mockUser;
    }
  };

  const signInWithGoogle = async (): Promise<User> => {
    if (auth) {
      const credential = await signInWithPopup(auth, googleProvider);
      setUser(credential.user);
      const userRole = await fetchUserRole(credential.user);
      setRole(userRole);

      // Simpan data login Google ke koleksi 'pengguna' di Firestore
      await saveToPenggunaDatabase(
        credential.user,
        credential.user.displayName || 'Pengguna Google',
        userRole,
        'google'
      );

      return credential.user;
    } else {
      // Offline simulation for Google Sign-In
      const mockUser = {
        uid: `google_sim_${Date.now()}`,
        email: 'bunia.dapurnia@gmail.com',
        displayName: 'Bu Nia',
      } as unknown as User;

      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(mockUser));
      localStorage.setItem(LOCAL_ROLE_KEY, 'pemilik');
      setUser(mockUser);
      setRole('pemilik');
      return mockUser;
    }
  };

  const signUp = async (
    name: string,
    email: string,
    pass: string,
    chosenRole: UserRole = 'pemilik'
  ): Promise<User> => {
    const finalName = name.trim() || (chosenRole === 'pemilik' ? 'Bu Nia' : 'Staf Dapur');

    if (auth) {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      await updateProfile(credential.user, {
        displayName: finalName,
      });

      // Simpan data pendaftaran ke koleksi 'pengguna' di Firestore
      await saveToPenggunaDatabase(credential.user, finalName, chosenRole, 'email_password');

      setUser(credential.user);
      setRole(chosenRole);
      return credential.user;
    } else {
      // Offline simulated user
      const mockUser = {
        uid: `sim_${Date.now()}`,
        email: email.trim(),
        displayName: finalName,
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
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        signIn,
        signInWithGoogle,
        signUp,
        signOutUser,
      }}
    >
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
