import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { makeRedirectUri } from "expo-auth-session";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { mapAuthError } from "../lib/errorMapping";
import { passwordScore } from "../lib/password";
import { fetchProfile, Profile } from "../lib/profileService";
import { supabase } from "../lib/supabase";

export interface AuthUser {
  id: string;
  email: string | null;
  emailConfirmed?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  profile?: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  mfaPending?: { factorId: string; email: string } | null;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshEmailConfirmation: () => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<void>;
  changeEmail: (newEmail: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USER_KEY = "WWW_AUTH_USER";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaPending, setMfaPending] = useState<{
    factorId: string;
    email: string;
  } | null>(null);

  // Initialize
  useEffect(() => {
    const init = async () => {
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          setUser({
            id: data.session.user.id,
            email: data.session.user.email ?? null,
            emailConfirmed: !!data.session.user.email_confirmed_at,
          });
          try {
            setProfile(await fetchProfile(data.session.user.id));
          } catch {}
        }
        // Listen auth changes
        supabase.auth.onAuthStateChange(
          async (_: AuthChangeEvent, session: Session | null) => {
            if (session?.user) {
              setUser({
                id: session.user.id,
                email: session.user.email ?? null,
                emailConfirmed: !!session.user.email_confirmed_at,
              });
              try {
                setProfile(await fetchProfile(session.user.id));
              } catch {}
            } else {
              setUser(null);
              setProfile(null);
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
    try {
      if (supabase) {
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          // Supabase MFA: code d'erreur 'mfa_required' ou message contenant 'MFA'
          const code = (error as any).status || (error as any).code || "";
          if (
            (error as any).error_description?.toLowerCase?.().includes("mfa") ||
            code === "mfa_required"
          ) {
            // Lister factors pour récupérer un facteur TOTP à challenger
            const factors = await supabase.auth.mfa.listFactors();
            const totp = factors.data?.totp?.[0];
            if (totp) {
              setMfaPending({ factorId: totp.id, email });
              return; // on ne lève pas d'erreur: on passera à l'écran challenge
            }
          }
          throw error;
        }
        if (data.user) {
          setUser({
            id: data.user.id,
            email: data.user.email ?? null,
            emailConfirmed: !!data.user.email_confirmed_at,
          });
          setMfaPending(null);
        }
      } else {
        if (password.length < 3) throw new Error("Mot de passe trop court");
        const fake: AuthUser = { id: "local-" + email, email };
        setUser(fake);
        await persistLocalUser(fake);
      }
    } catch (e: any) {
      throw new Error(mapAuthError(e));
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const score = passwordScore(password);
    if (score < 2) {
      throw new Error(
        "Mot de passe trop faible (min 8 caractères + chiffres et lettres)"
      );
    }
    try {
      if (supabase) {
        const redirectTo = makeRedirectUri({ scheme: "whatwewatch" });
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectTo },
        });
        if (error) throw error;
        if (data.user)
          setUser({
            id: data.user.id,
            email: data.user.email ?? null,
            emailConfirmed: !!data.user.email_confirmed_at,
          });
      } else {
        if (password.length < 6) throw new Error("Mot de passe trop court");
        const fake: AuthUser = { id: "local-" + email, email };
        setUser(fake);
        await persistLocalUser(fake);
      }
    } catch (e: any) {
      throw new Error(mapAuthError(e));
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
    if (!email) throw new Error("Email requis");
    if (supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: process.env.EXPO_PUBLIC_SUPABASE_REDIRECT_URL,
      });
      if (error) throw error;
    } else {
      // Fallback: simuler délai
      await new Promise((r) => setTimeout(r, 500));
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user && supabase) {
      setProfile(await fetchProfile(user.id));
    }
  }, [user]);

  const refreshEmailConfirmation = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      setUser((prev) =>
        prev
          ? {
              ...prev,
              emailConfirmed: !!data.user?.email_confirmed_at,
            }
          : {
              id: data.user.id,
              email: data.user.email ?? null,
              emailConfirmed: !!data.user.email_confirmed_at,
            }
      );
    }
  }, []);

  const resendConfirmationEmail = useCallback(async (email: string) => {
    if (!supabase) throw new Error("Non disponible en local");
    if (!email) throw new Error("Email requis");
    // Supabase v2: auth.resend (type 'signup')
    // Si non supporté dans ta version, cela renverra une erreur.
    // @ts-ignore
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: process.env.EXPO_PUBLIC_SUPABASE_REDIRECT_URL,
      },
    });
    if (error) throw error;
  }, []);

  const changeEmail = useCallback(async (newEmail: string) => {
    if (!supabase) throw new Error("Non disponible en local");
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) throw new Error(mapAuthError(error));
  }, []);

  const deleteAccount = useCallback(async () => {
    throw new Error(
      "Suppression de compte: implémente une edge function sécurisée (service role)."
    );
  }, []);

  // Google OAuth (Supabase PKCE flow)
  const signInWithGoogle = useCallback(async () => {
    if (!supabase) throw new Error("OAuth indisponible en mode local");
    const redirectTo = makeRedirectUri({ scheme: "whatwewatch" });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) throw error;
    // Sur mobile Expo, l'URL est ouverte automatiquement par le SDK (browser)
  }, []);

  // Apple Sign In
  const signInWithApple = useCallback(async () => {
    if (!supabase) throw new Error("OAuth indisponible en mode local");
    const redirectTo = makeRedirectUri({ scheme: "whatwewatch" });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo },
    });
    if (error) throw error;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        signInWithGoogle,
        signInWithApple,
        refreshProfile,
        refreshEmailConfirmation,
        resendConfirmationEmail,
        changeEmail,
        deleteAccount,
        mfaPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
