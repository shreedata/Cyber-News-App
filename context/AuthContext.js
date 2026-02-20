import React, { createContext, useContext, useState } from 'react';
import { router } from 'expo-router';
import { supabase, handlePostAuth } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);

  const signIn = async (email, password) => {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    
    await handlePostAuth(data.session);
    setSession(data.session);
    router.replace('/(app)/(tabs)');
  };

  const signUp = async (email, password, fullName) => {
    try {
      setError(null);
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      // Automatically sign in the user after sign up
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw new Error(signInError.message);
      }

      await handlePostAuth(signInData.session);
      setSession(signInData.session);
      router.replace('/(app)/(tabs)');
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setSession(null);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated: !!session,
      signIn, 
      signUp, 
      signOut,
      session,
      user: session?.user,
      error,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}