import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const ADMIN_EMAILS = ['agrinolan@gmail.com', 'tammylouise407@gmail.com'];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

    async function initializeAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (session?.user) {
          // Get user role
          const { data: roleData } = await supabase
            .rpc('get_user_role', { user_id: session.user.id });

          setUser({
            id: session.user.id,
            email: session.user.email!,
            role: session.user.email?.toLowerCase() in ADMIN_EMAILS ? 'admin' : 'user'
          });

          setIsAdmin(ADMIN_EMAILS.includes(session.user.email?.toLowerCase() || ''));
        }
        setLoading(false);

        // Set up auth state change subscription
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (!isMounted) return;

          if (session?.user) {
            // Get user role
            const { data: roleData } = await supabase
              .rpc('get_user_role', { user_id: session.user.id });

            setUser({
              id: session.user.id,
              email: session.user.email!,
              role: session.user.email?.toLowerCase() in ADMIN_EMAILS ? 'admin' : 'user'
            });

            setIsAdmin(ADMIN_EMAILS.includes(session.user.email?.toLowerCase() || ''));
          } else {
            setUser(null);
            setIsAdmin(false);
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
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: window.location.origin
      }
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signIn, signUp, signOut }}>
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