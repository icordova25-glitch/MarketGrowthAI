"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { isDemoModeEnabled, supabase } from "@/lib/supabase";

type AuthUser = Pick<User, "id" | "email"> & { name?: string; role: "customer" | "owner" };

type AuthResult = {
  error?: string;
  confirmationRequired?: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isDemoMode: boolean;
  getAccessToken: () => Promise<string | null>;
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
  const configuredDemoOwner = process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL?.toLowerCase() ?? "";
  return {
    id: `demo-${values.email.toLowerCase()}`,
    email: values.email.toLowerCase(),
    name: `${values.firstName} ${values.lastName}`.trim(),
    role: configuredDemoOwner && values.email.toLowerCase() === configuredDemoOwner ? "owner" : "customer",
  };
}

function normalizeDemoUser(user: Omit<AuthUser, "role"> & { role?: AuthUser["role"] }): AuthUser {
  const configuredDemoOwner = process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL?.toLowerCase() ?? "";
  return {
    ...user,
    role: user.role ?? (configuredDemoOwner && user.email?.toLowerCase() === configuredDemoOwner ? "owner" : "customer"),
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
  const [isLoading, setIsLoading] = useState(() => !(!supabase && !isDemoModeEnabled));

  useEffect(() => {
    if (!supabase) {
      if (!isDemoModeEnabled) return;

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
    isDemoMode: isDemoModeEnabled,
    async getAccessToken() {
      if (!supabase) return null;
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    },
    async signUp(values) {
      if (!supabase) {
        if (!isDemoModeEnabled) {
          return { error: "Authentication is unavailable until Supabase is configured." };
        }
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
        if (!isDemoModeEnabled) {
          return { error: "Authentication is unavailable until Supabase is configured." };
        }
        const configuredDemoOwner = process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL?.toLowerCase() ?? "";
        const demoUser: AuthUser = {
          id: `demo-${email.toLowerCase()}`,
          email: email.toLowerCase(),
          name: email.split("@")[0],
          role: configuredDemoOwner && email.toLowerCase() === configuredDemoOwner ? "owner" : "customer",
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
        return { error: "Password reset is unavailable until Supabase is configured." };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      return error ? { error: error.message } : {};
    },
    async signOut() {
      if (supabase) await supabase.auth.signOut();
      if (isDemoModeEnabled) window.localStorage.removeItem(DEMO_SESSION_KEY);
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