import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, facebookProvider, db } from '../lib/firebase';
import { AppData } from '../types';
import { DEFAULT_APP_DATA, saveAppData, loadAppData } from './storage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  logOut: () => Promise<void>;
  saveToCloud: (data: AppData) => Promise<void>;
  loadFromCloud: () => Promise<AppData | null>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups for this site and try again.');
      } else {
        setError(err.message || 'Failed to authenticate with Google. Please try again.');
      }
    }
  };

  const signInWithFacebook = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, facebookProvider);
    } catch (err: any) {
      console.error('Facebook Auth Error:', err);
      if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups for this site and try again.');
      } else {
        setError(err.message || 'Failed to authenticate with Facebook. Please try again.');
      }
    }
  };

  const logOut = async () => {
    setError(null);
    try {
      await signOut(auth);
    } catch (err: any) {
      console.error('Logout Error:', err);
      setError('Failed to sign out. Please try again.');
    }
  };

  const saveToCloud = async (data: AppData) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        appData: data,
        updatedAt: Date.now()
      });
    } catch (err) {
      console.error('Failed to sync state to Firestore:', err);
    }
  };

  const loadFromCloud = async (): Promise<AppData | null> => {
    if (!user) return null;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const cloudData = userDoc.data();
        if (cloudData && cloudData.appData) {
          return cloudData.appData as AppData;
        }
      }
    } catch (err) {
      console.error('Failed to load user state from Firestore:', err);
    }
    return null;
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithFacebook,
        logOut,
        saveToCloud,
        loadFromCloud,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
