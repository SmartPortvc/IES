import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { 
  User as FirebaseUser, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { User } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userRole: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  registerPortUser: (email: string, password: string, portId: string) => Promise<void>;
  registerHodUser: (email: string, password: string, hodId: string, name: string, designation: string, department: string) => Promise<void>;
  loading: boolean;
  userDetails: Partial<User> | null;
  isOffline: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<Partial<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load user data from localStorage on mount
  useEffect(() => {
    const savedUserRole = localStorage.getItem('userRole');
    const savedUserDetails = localStorage.getItem('userDetails');
    
    if (savedUserRole) {
      setUserRole(savedUserRole);
    }
    if (savedUserDetails) {
      setUserDetails(JSON.parse(savedUserDetails));
    }
  }, []);

  const fetchUserData = async (userId: string, retryCount = 0): Promise<Partial<User> | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data() as Partial<User>;
      }
      return null;
    } catch (error: any) {
      // Check if we're offline or if it's a network-related error
      if (error.code === 'failed-precondition' || error.code === 'unavailable' || error.code === 'auth/network-request-failed') {
        setIsOffline(true);
        
        // If we have cached data, use it
        const cachedDetails = localStorage.getItem('userDetails');
        if (cachedDetails) {
          return JSON.parse(cachedDetails);
        }

        // If we haven't exceeded max retries and we're online, try again
        if (retryCount < MAX_RETRIES && navigator.onLine) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
          await wait(delay);
          return fetchUserData(userId, retryCount + 1);
        }
      }
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          const userData = await fetchUserData(user.uid);
          if (userData) {
            setUserRole(userData.role || null);
            setUserDetails(userData);
            
            // Persist user data in localStorage
            localStorage.setItem('userRole', userData.role || '');
            localStorage.setItem('userDetails', JSON.stringify(userData));
            setIsOffline(false);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          // Don't clear stored data on error if we're offline
          if (!isOffline) {
            localStorage.removeItem('userRole');
            localStorage.removeItem('userDetails');
          }
        }
      } else {
        setUserRole(null);
        setUserDetails(null);
        localStorage.removeItem('userRole');
        localStorage.removeItem('userDetails');
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userData = await fetchUserData(userCredential.user.uid);
      
      if (userData) {
        setUserRole(userData.role || null);
        setUserDetails(userData);
        
        // Persist user data in localStorage
        localStorage.setItem('userRole', userData.role || '');
        localStorage.setItem('userDetails', JSON.stringify(userData));
      }
    } catch (error: any) {
      if (error.code === 'auth/network-request-failed') {
        setIsOffline(true);
        throw new Error('Unable to login while offline. Please check your internet connection.');
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('userRole');
      localStorage.removeItem('userDetails');
      setUserRole(null);
      setUserDetails(null);
    } catch (error) {
      console.error("Error during logout:", error);
      throw error;
    }
  };

  const registerPortUser = async (email: string, password: string, portId: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userData = {
        uid: user.uid,
        email: user.email,
        role: 'port',
        portId: portId
      };
      
      await setDoc(doc(db, 'users', user.uid), userData);
      
      setUserRole('port');
      setUserDetails(userData);
      
      localStorage.setItem('userRole', 'port');
      localStorage.setItem('userDetails', JSON.stringify(userData));
    } catch (error: any) {
      if (error.code === 'auth/network-request-failed') {
        setIsOffline(true);
        throw new Error('Unable to register while offline. Please check your internet connection.');
      }
      throw error;
    }
  };

  const registerHodUser = async (
    email: string, 
    password: string, 
    hodId: string,
    name: string,
    designation: string,
    department: string
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userData = {
        uid: user.uid,
        email: user.email,
        role: 'hod',
        hodId: hodId,
        name: name,
        designation: designation,
        department: department,
        viewOnly: true
      };
      
      await setDoc(doc(db, 'users', user.uid), userData);
      
      setUserRole('hod');
      setUserDetails(userData);
      
      localStorage.setItem('userRole', 'hod');
      localStorage.setItem('userDetails', JSON.stringify(userData));
    } catch (error: any) {
      if (error.code === 'auth/network-request-failed') {
        setIsOffline(true);
        throw new Error('Unable to register while offline. Please check your internet connection.');
      }
      throw error;
    }
  };

  const value = useMemo(() => ({
    currentUser,
    userRole,
    userDetails,
    login,
    logout,
    registerPortUser,
    registerHodUser,
    loading,
    isOffline
  }), [currentUser, userRole, userDetails, loading, isOffline]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};