import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      checkAdminStatus(session?.user?.email ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      checkAdminStatus(session?.user?.email ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAdminStatus = async (email: string | null) => {
    if (!email) {
      setIsAdmin(false);
      return;
    }

    try {
      const { data: admin, error: adminError } = await supabase
        .from('admin_emails')
        .select('email')
        .eq('email', email)
        .single();

      if (adminError && adminError.code === 'PGRST116') {
        // No admin found
        setIsAdmin(false);
        return;
      }

      if (adminError) throw adminError;
      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if the user is an admin after successful login
      await checkAdminStatus(email);
    } catch (error) {
      console.error('Sign in error:', error);
      setError(error instanceof Error ? error.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // First check if we have a session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // If no session, clear user state and return
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // If we have a session, proceed with sign out
      const { error } = await supabase.auth.signOut();
      if (error) {
        // If sign out fails, still clear user state
        console.error('Sign out error:', error);
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // If successful, clear user state
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Sign out error:', error);
      setError(error instanceof Error ? error.message : 'Sign out failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, loading, error, isAdmin }}>
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