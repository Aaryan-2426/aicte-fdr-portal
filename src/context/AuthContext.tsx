import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserRole } from '../types/fdr';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  instituteName?: string;
  permanentInstituteId?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  loginWithCredentials: (role: UserRole, email: string, displayName?: string, instituteName?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  authError: null,
  clearAuthError: () => {},
  signInWithGoogle: async () => {},
  loginWithCredentials: async () => {},
  logout: async () => {},
  updateUserRole: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const stored = sessionStorage.getItem('aicte_user_profile');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setUserProfile(data);
            sessionStorage.setItem('aicte_user_profile', JSON.stringify(data));
          } else {
            // New user registration in Firestore
            const initialProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || 'Authorized Official',
              photoURL: currentUser.photoURL || undefined,
              role: 'central_director',
              instituteName: 'AICTE Headquarters, New Delhi',
              permanentInstituteId: '1-00000001',
            };
            await setDoc(userDocRef, initialProfile);
            setUserProfile(initialProfile);
            sessionStorage.setItem('aicte_user_profile', JSON.stringify(initialProfile));
          }
        } catch (err) {
          console.error('Error fetching/creating user profile in Firestore:', err);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithCredentials = async (
    role: UserRole,
    email: string,
    displayName?: string,
    instituteName?: string
  ) => {
    try {
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      } catch (authErr) {
        console.warn('Anonymous auth note:', authErr);
      }

      const profile: UserProfile = {
        uid: auth.currentUser?.uid || `cred-${Date.now()}`,
        email,
        displayName: displayName || email.split('@')[0].replace('.', ' ').toUpperCase(),
        role,
        instituteName: instituteName || (
          role === 'central_director'
            ? 'AICTE Central Bureau, New Delhi'
            : role === 'regional_officer'
            ? 'AICTE Regional Office (North)'
            : role === 'bank_officer'
            ? 'State Bank of India - Central Clearing Branch'
            : 'Techno Institute of Technology & Science'
        ),
        permanentInstituteId: role === 'institute_head' ? '1-458921102' : undefined,
      };

      setUserProfile(profile);
      sessionStorage.setItem('aicte_user_profile', JSON.stringify(profile));
      setAuthError(null);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const loggedUser = result.user;
      const userDocRef = doc(db, 'users', loggedUser.uid);
      const snap = await getDoc(userDocRef);
      if (!snap.exists()) {
        const profile: UserProfile = {
          uid: loggedUser.uid,
          email: loggedUser.email || '',
          displayName: loggedUser.displayName || 'Authorized Official',
          photoURL: loggedUser.photoURL || undefined,
          role: 'central_director',
          instituteName: 'AICTE Headquarters, New Delhi',
          permanentInstituteId: '1-00000001',
        };
        await setDoc(userDocRef, profile);
        setUserProfile(profile);
        sessionStorage.setItem('aicte_user_profile', JSON.stringify(profile));
      } else {
        const data = snap.data() as UserProfile;
        setUserProfile(data);
        sessionStorage.setItem('aicte_user_profile', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Google Sign-in error:', error);
      setAuthError(error instanceof Error ? error.message : String(error));
    }
  };

  const logout = async () => {
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
      setUser(null);
      setUserProfile(null);
      sessionStorage.removeItem('aicte_user_profile');
    } catch (error) {
      console.error('Sign-out error:', error);
    }
  };

  const updateUserRole = async (role: UserRole) => {
    if (userProfile) {
      const updated = { ...userProfile, role };
      setUserProfile(updated);
      sessionStorage.setItem('aicte_user_profile', JSON.stringify(updated));
    }
    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { role }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        authError,
        clearAuthError: () => setAuthError(null),
        signInWithGoogle,
        loginWithCredentials,
        logout,
        updateUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
