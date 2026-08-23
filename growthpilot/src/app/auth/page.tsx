"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

type View = "sign-up" | "sign-in" | "reset";

export default function AuthPage() {
  const [view, setView] = useState<View>("sign-up");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signUp, signIn, resetPassword, isDemoMode } = useAuth();
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    setError("");
    setMessage("");
    setIsSubmitting(true);

    if (view === "reset") {
      const result = await resetPassword(email);
      setIsSubmitting(false);
      if (result.error) setError(result.error);
      else setMessage("Check your inbox for a password reset link.");
      return;
    }

    if (!email || !password || (view === "sign-up" && password.length < 8)) {
      setIsSubmitting(false);
      setError(view === "sign-up" ? "Use a valid email and a password with at least 8 characters." : "Enter your email and password.");
      return;
    }

    const result = view === "sign-up"
      ? await signUp({
          firstName: String(formData.get("firstName") || "").trim(),
          lastName: String(formData.get("lastName") || "").trim(),
          email,
          password,
        })
      : await signIn(email, password);

    setIsSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else if (result.confirmationRequired) {
      setMessage("Check your inbox to confirm your email, then return here to sign in.");
      setView("sign-in");
    } else {
      router.replace(email.toLowerCase() === "owner@example.test" ? "/admin" : "/onboarding");
    }
  }

  const isSignUp = view === "sign-up";
  const isReset = view === "reset";

  return (
    <div className="grid min-h-screen bg-[#0a0f1e] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-[#102a43] p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(56,189,248,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.12)_1px,transparent_1px)] [background-size:38px_38px]" />
          <div className="relative flex items-center gap-3 text-white">
          <div className="flex size-10 items-center justify-center rounded-lg bg-cyan-400 font-bold text-slate-950">M</div>
          <div><div className="text-lg font-bold">MarketGrowthAI</div><div className="text-xs text-cyan-100">AI Marketing Platform</div></div>
        </div>
        <div className="relative max-w-lg">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">One clear next move</p>
          <h1 className="text-5xl font-bold leading-tight text-white">See what will grow your business next.</h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-slate-300">Turn your website, Google, and social signals into focused actions your team can actually take.</p>
          <div className="mt-10 grid grid-cols-3 gap-3">
            {["Website", "Google", "Social"].map((item) => <div key={item} className="border border-cyan-200/20 bg-slate-950/20 px-3 py-4 text-center text-sm font-medium text-cyan-100">{item}</div>)}
          </div>
        </div>
        <p className="relative text-sm text-slate-400">Your data stays connected to your business, not your browser.</p>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden"><div className="flex size-9 items-center justify-center rounded-lg bg-cyan-400 font-bold text-slate-950">M</div><span className="font-bold text-white">MarketGrowthAI</span></div>
          <div className="mb-7">
            <h2 className="text-3xl font-bold text-white">{isSignUp ? "Create your workspace" : isReset ? "Reset your password" : "Welcome back"}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{isSignUp ? "Start with your account. Your business setup comes next." : isReset ? "We will send a secure reset link to your email." : "Sign in to continue building your growth plan."}</p>
          </div>

          {isDemoMode && <div className="mb-5 flex gap-3 border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-5 text-amber-100"><Sparkles size={16} className="mt-0.5 shrink-0" />Demo mode is active. Add Supabase variables to enable secure account persistence.</div>}
          {error && <div role="alert" className="mb-5 border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
          {message && <div className="mb-5 flex gap-3 border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100"><CheckCircle2 size={18} className="shrink-0" />{message}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && <div className="grid grid-cols-2 gap-4"><Field label="First name" name="firstName" autoComplete="given-name" required /><Field label="Last name" name="lastName" autoComplete="family-name" required /></div>}
            <Field label="Email" name="email" type="email" autoComplete="email" required />
            {!isReset && <Field label="Password" name="password" type="password" autoComplete={isSignUp ? "new-password" : "current-password"} hint={isSignUp ? "At least 8 characters" : undefined} required />}
            <button disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? "Please wait..." : isSignUp ? "Create account" : isReset ? "Send reset link" : "Log in"}<ArrowRight size={17} />
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            {isSignUp ? <>Already have an account? <button type="button" onClick={() => { setView("sign-in"); setError(""); setMessage(""); }} className="font-semibold text-cyan-300 hover:text-cyan-200">Log in</button></> : isReset ? <button type="button" onClick={() => { setView("sign-in"); setError(""); setMessage(""); }} className="font-semibold text-cyan-300 hover:text-cyan-200">Back to log in</button> : <><button type="button" onClick={() => { setView("reset"); setError(""); setMessage(""); }} className="mr-4 font-semibold text-cyan-300 hover:text-cyan-200">Forgot password?</button><button type="button" onClick={() => { setView("sign-up"); setError(""); setMessage(""); }} className="font-semibold text-cyan-300 hover:text-cyan-200">Create an account</button></>}
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, name, type = "text", autoComplete, hint, required }: { label: string; name: string; type?: string; autoComplete?: string; hint?: string; required?: boolean }) {
  const Icon = type === "password" ? LockKeyhole : type === "email" ? Mail : undefined;
  return <label className="block"><span className="mb-1.5 flex justify-between text-sm font-medium text-slate-200">{label}{hint && <span className="font-normal text-slate-500">{hint}</span>}</span><div className="relative">{Icon && <Icon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />}<input name={name} type={type} autoComplete={autoComplete} required={required} className={`w-full border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-cyan-400 ${Icon ? "pl-10" : ""}`} /></div></label>;
}