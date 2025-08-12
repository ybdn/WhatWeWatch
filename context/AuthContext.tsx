import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "../lib/supabase";

export interface AuthUser {
  id: string;
  email: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USER_KEY = "WWW_AUTH_USER";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize
  useEffect(() => {
    const init = async () => {
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          setUser({
            id: data.session.user.id,
            email: data.session.user.email ?? null,
          });
        }
        // Listen auth changes
        supabase.auth.onAuthStateChange(
          (_: AuthChangeEvent, session: Session | null) => {
            if (session?.user) {
              setUser({
                id: session.user.id,
                email: session.user.email ?? null,
              });
            } else {
              setUser(null);
            }
          }
        );
      } else {
        // Fallback local stored user
        const raw = await AsyncStorage.getItem(LOCAL_USER_KEY);
        if (raw) setUser(JSON.parse(raw));
      }
      setLoading(false);
    };
    init();
  }, []);

  const persistLocalUser = async (u: AuthUser | null) => {
    if (u) await AsyncStorage.setItem(LOCAL_USER_KEY, JSON.stringify(u));
    else await AsyncStorage.removeItem(LOCAL_USER_KEY);
  };

  const signIn = useCallback(async (email: string, password: string) => {
    if (supabase) {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (data.user)
        setUser({ id: data.user.id, email: data.user.email ?? null });
    } else {
      // Dev fallback: accept any password length >=3
      if (password.length < 3) throw new Error("Mot de passe trop court");
      const fake: AuthUser = { id: "local-" + email, email };
      setUser(fake);
      await persistLocalUser(fake);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (supabase) {
      const { error, data } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data.user)
        setUser({ id: data.user.id, email: data.user.email ?? null });
    } else {
      if (password.length < 6) throw new Error("Mot de passe trop court");
      const fake: AuthUser = { id: "local-" + email, email };
      setUser(fake);
      await persistLocalUser(fake);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    setUser(null);
    await persistLocalUser(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!email) throw new Error('Email requis');
    if (supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: process.env.EXPO_PUBLIC_SUPABASE_REDIRECT_URL,
      });
      if (error) throw error;
    } else {
      // Fallback: simuler délai
      await new Promise(r => setTimeout(r, 500));
    }
  }, []);

  return (
  <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
