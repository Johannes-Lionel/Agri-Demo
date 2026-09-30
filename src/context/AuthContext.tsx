import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, 
  onAuthStateChanged, User 
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsDemo: (role?: UserRole) => void;
  signOut: () => Promise<void>;
  updateRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>({
    userId: 'usr-default',
    displayName: 'Dr. Sarah Lin (Lead Q/A)',
    email: 'sarah.lin@agrigrade.org',
    role: 'inspector',
    facilityName: 'Central Allium Packhouse #4',
    createdAt: '2026-09-01T00:00:00.000Z',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        setUser((prev) => ({
          userId: fbUser.uid,
          displayName: fbUser.displayName || 'Certified Inspector',
          email: fbUser.email || '',
          role: prev?.role || 'inspector',
          facilityName: prev?.facilityName || 'AgriGrade Packhouse Facility',
          createdAt: prev?.createdAt || new Date().toISOString(),
        }));
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      if (res.user) {
        setUser({
          userId: res.user.uid,
          displayName: res.user.displayName || 'Authorized Inspector',
          email: res.user.email || '',
          role: 'inspector',
          facilityName: 'AgriGrade Packhouse Facility',
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('Google sign-in popup closed or cancelled:', err);
    } finally {
      setLoading(false);
    }
  };

  const signInAsDemo = (role: UserRole = 'inspector') => {
    setUser({
      userId: `demo-${role}-${Date.now()}`,
      displayName: role === 'admin' ? 'Chief Operations Admin' : role === 'manager' ? 'Packhouse Q/A Manager' : 'Senior Onion Inspector',
      email: `${role}@agrigrade-packhouse.internal`,
      role,
      facilityName: 'AgriGrade Regional Terminal #12',
      createdAt: new Date().toISOString(),
    });
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch {
      // ignore
    }
    setUser(null);
  };

  const updateRole = (role: UserRole) => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        signInWithGoogle,
        signInAsDemo,
        signOut,
        updateRole,
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
