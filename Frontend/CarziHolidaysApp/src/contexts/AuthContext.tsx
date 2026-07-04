import React, { createContext, useContext, useEffect, useState } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

type UserRole = 'customer' | 'agency' | 'driver';

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  isDriver: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string, role: UserRole) => Promise<void>;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

const getErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: string }).message || 'Authentication failed');
  }
  return 'Authentication failed';
};

const loginWithBackend = async (email: string, password: string, role: UserRole) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, role }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || 'Login failed');
  }

  return data as { customToken: string };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [isDriver, setIsDriver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkUserRole = async (uid: string) => {
    try {
      const userDoc = await firestore().collection('users').doc(uid).get();
      const userData = userDoc.data() || {};
      setIsDriver(userData.role === 'driver' || userData.type === 'driver');
    } catch (error) {
      console.error('Error checking user role:', error);
      setIsDriver(false);
    }
  };

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await checkUserRole(currentUser.uid);
      } else {
        setIsDriver(false);
      }
      setIsLoading(false);
    });

    return subscriber;
  }, []);

  const signIn = async (email: string, password: string, role: UserRole) => {
    try {
      setIsLoading(true);
      await auth().signOut();
      const { customToken } = await loginWithBackend(email, password, role);
      await auth().signInWithCustomToken(customToken);
    } catch (error) {
      console.error('Sign in error:', error);
      throw new Error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      setIsLoading(true);
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      await userCredential.user?.updateProfile({ displayName: userData.name });

      await firestore().collection('users').doc(userCredential.user?.uid).set({
        ...userData,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await auth().signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      await auth().sendPasswordResetEmail(email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isDriver,
        isLoading,
        signIn,
        signUp,
        signOut,
        resetPassword,
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
