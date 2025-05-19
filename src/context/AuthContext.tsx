import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

    async function initializeAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
          });
        }
        setLoading(false);

        // Set up auth state change subscription
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (!isMounted) return;

          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email!,
            });
          } else {
            setUser(null);
          }
        });

        authSubscription = subscription;
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    return () => {
      isMounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ 
      email, 
      password,
      options: {
        emailRedirectTo: window.location.origin
      }
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          email_confirmed: true // This ensures the user can sign in immediately
        }
      }
    });
    
    if (error) {
      if (error.message.includes('already registered')) {
        throw new Error('This email is already registered. Please use a different email or try logging in.');
      }
      throw error;
    }
    
    // Auto sign in after signup
    if (data.user) {
      await signIn(email, password);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}