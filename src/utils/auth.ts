import { supabase } from '../lib/supabase';

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Sign in error:', error);
    return { error };
  }

  return { data, error: null };
}

export async function signUp(
  email: string,
  password: string,
  firstName: string,
  surname: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        surname,
      },
    },
  });

  if (error) {
    console.error('Sign up error:', error);
    return { error };
  }

  return { data, error: null };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return error;
}

export async function verifyOtp(email: string, token: string) {
  const { error } = await supabase.auth.verifyOtp({
    email,
    type: 'signup',
    token,
  });

  return error;
}
