"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type AuthUser = Pick<User, "id" | "email"> & { name?: string; role: "customer" | "owner" };

type AuthResult = {
  error?: string;
  confirmationRequired?: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isDemoMode: boolean;
  signUp: (values: SignUpValues) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

type SignUpValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

const DEMO_SESSION_KEY = "marketgrowthai.demo-session";
const AuthContext = createContext<AuthContextValue | null>(null);

function createDemoUser(values: Pick<SignUpValues, "firstName" | "lastName" | "email">): AuthUser {
  return {
    id: `demo-${values.email.toLowerCase()}`,
    email: values.email.toLowerCase(),
    name: `${values.firstName} ${values.lastName}`.trim(),
    role: values.email.toLowerCase() === "owner@example.test" ? "owner" : "customer",
  };
}

function normalizeDemoUser(user: Omit<AuthUser, "role"> & { role?: AuthUser["role"] }): AuthUser {
  return {
    ...user,
    role: user.role ?? (user.email?.toLowerCase() === "owner@example.test" ? "owner" : "customer"),
  };
}

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: [user.user_metadata.first_name, user.user_metadata.last_name].filter(Boolean).join(" ") || user.email?.split("@")[0],
    role: user.app_metadata.platform_role === "owner" ? "owner" : "customer",
  };
}

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      const timer = window.setTimeout(() => {
        const storedSession = window.localStorage.getItem(DEMO_SESSION_KEY);
        if (storedSession) {
          const demoUser = normalizeDemoUser(JSON.parse(storedSession) as AuthUser);
          window.localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(demoUser));
          setUser(demoUser);
        }
        setIsLoading(false);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ? toAuthUser(data.user) : null);
      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? toAuthUser(session.user) : null);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    isDemoMode: !isSupabaseConfigured,
    async signUp(values) {
      if (!supabase) {
        const demoUser = createDemoUser(values);
        window.localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(demoUser));
        setUser(demoUser);
        return {};
      }

      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { first_name: values.firstName, last_name: values.lastName },
          emailRedirectTo: `${window.location.origin}/onboarding`,
        },
      });

      if (error) return { error: error.message };
      return { confirmationRequired: !data.session };
    },
    async signIn(email, password) {
      if (!supabase) {
        const demoUser: AuthUser = {
          id: `demo-${email.toLowerCase()}`,
          email: email.toLowerCase(),
          name: email.split("@")[0],
          role: email.toLowerCase() === "owner@example.test" ? "owner" : "customer",
        };
        window.localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(demoUser));
        setUser(demoUser);
        return {};
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? { error: error.message } : {};
    },
    async resetPassword(email) {
      if (!supabase) {
        return { error: "Password reset is available once Supabase is connected." };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      return error ? { error: error.message } : {};
    },
    async signOut() {
      if (supabase) await supabase.auth.signOut();
      window.localStorage.removeItem(DEMO_SESSION_KEY);
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}