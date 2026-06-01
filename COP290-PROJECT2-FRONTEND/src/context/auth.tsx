import {createContext, useState, useEffect} from 'react';
import type {ReactNode} from 'react';
import {apiFetch} from '../lib/api';

import type {User, AuthContextType} from './auth.types';
//Container for auth state and functions
export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({children}: {children: ReactNode}) => {
  //setUser-> updates the userstate
  const [user, setUser] = useState<User | null>(null);
  //initially,set loading is true
  const [loading, setLoading] = useState(true);
  const login = (userData: User) => setUser(userData);
  const logout = () => setUser(null);
  //we will run this only once
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const userData = await apiFetch('/user/me');
        setUser(userData);
      } catch (error) {
        try {
          await apiFetch('/auth/refresh', {method: 'POST'});
          const newUserData = await apiFetch('/user/me');
          setUser(newUserData);
        } catch (refreshError) {
          //logout if refresh also fails
          setUser(null);
        }
      } finally {
        //once done,set loading to false
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);
  //we will run this whenever user state changes.
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(
      //we will run this every 50 mins
      async () => {
        try {
          await apiFetch('/auth/refresh', {method: 'POST'});
        } catch (error) {
          setUser(null);
        }
      },
      50 * 60 * 1000, //50 mins
    );
    return () => clearInterval(interval);
  }, [user /*whenever user changes we run this*/]);
  //we provide these states to rest of the app through context
  return (
    <AuthContext.Provider value={{user, loading, login, logout}}>
      {children}
    </AuthContext.Provider>
  );
};
