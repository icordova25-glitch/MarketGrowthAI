"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Building2, Check, MapPinned, Target, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";

const steps = ["Business", "Customers", "Marketing channels"];
const channels = [
  "Website",
  "Google Business Profile",
  "Instagram",
  "Facebook",
  "TikTok",
  "YouTube",
  "LinkedIn",
  "Email marketing",
];

type BusinessProfile = {
  businessName: string;
  industry: string;
  businessType: string;
  city: string;
  state: string;
  website: string;
  idealCustomers: string;
  productsAndServices: string;
  serviceArea: string;
  differentiator: string;
};

const initialProfile: BusinessProfile = {
  businessName: "",
  industry: "",
  businessType: "",
  city: "",
  state: "",
  website: "",
  idealCustomers: "",
  productsAndServices: "",
  serviceArea: "",
  differentiator: "",
};

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<BusinessProfile>(initialProfile);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const router = useRouter();

  function handleNext(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < steps.length - 1) {
      setStep((current) => current + 1);
      return;
    }
    setIsSaving(true);
    window.localStorage.setItem(
      "marketgrowthai.business",
      JSON.stringify({ ...profile, marketingChannels: selectedChannels })
    );
    router.replace("/connections");
  }

  function updateField(name: keyof BusinessProfile, value: string) {
    setProfile((current) => ({ ...current, [name]: value }));
  }

  function toggleChannel(channel: string) {
    setSelectedChannels((current) =>
      current.includes(channel)
        ? current.filter((item) => item !== channel)
        : [...current, channel]
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center py-8">
      <div className="w-full">
        <div className="mb-10"><p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-300">Workspace setup</p><h1 className="mt-2 text-3xl font-bold text-white">Tell us how your business grows.</h1><p className="mt-2 max-w-2xl text-slate-400">This context helps MarketGrowthAI understand your customers, evaluate the right channels, and create a relevant first analysis.</p></div>
        <div className="mb-10 grid grid-cols-3 gap-2">{steps.map((label, index) => <div key={label}><div className={`h-1 ${index <= step ? "bg-cyan-400" : "bg-slate-800"}`} /><p className={`mt-2 text-xs ${index <= step ? "text-cyan-200" : "text-slate-600"}`}>Step {index + 1} · {label}</p></div>)}</div>
        <form onSubmit={handleNext} className="border border-slate-700 bg-slate-900 p-6 sm:p-8">
          {step === 0 && <StepContent icon={<Building2 size={22} />} title="About the business" description="Start with the core details MarketGrowthAI needs to create relevant benchmarks."><div className="grid gap-4 sm:grid-cols-2"><Field label="Business name" name="businessName" placeholder="Northstar Studio" value={profile.businessName} onChange={updateField} required /><Field label="Industry" name="industry" placeholder="Professional services" value={profile.industry} onChange={updateField} required /><Field label="Business type" name="businessType" placeholder="Local service business" value={profile.businessType} onChange={updateField} required /><Field label="Website" name="website" type="url" placeholder="https://example.com" value={profile.website} onChange={updateField} required /><Field label="City" name="city" placeholder="Austin" value={profile.city} onChange={updateField} required /><Field label="State" name="state" placeholder="Texas" value={profile.state} onChange={updateField} required /></div></StepContent>}
          {step === 1 && <StepContent icon={<Target size={22} />} title="Your customers and value" description="Help us understand who you serve and why they choose you."><div className="grid gap-5"><TextArea label="Who are your ideal customers?" name="idealCustomers" placeholder="Describe the people or businesses you most want to reach." value={profile.idealCustomers} onChange={updateField} required /><TextArea label="What products or services do you sell?" name="productsAndServices" placeholder="List your main offers, services, or product categories." value={profile.productsAndServices} onChange={updateField} required /><TextArea label="What geographic areas do you serve?" name="serviceArea" placeholder="For example: Austin metro, Central Texas, or nationwide." value={profile.serviceArea} onChange={updateField} required /><TextArea label="What makes your business different?" name="differentiator" placeholder="Describe the experience, expertise, results, or approach that sets you apart." value={profile.differentiator} onChange={updateField} required /></div></StepContent>}
          {step === 2 && <StepContent icon={<UsersRound size={22} />} title="Your marketing channels" description="Choose the channels you actively use today. You can connect them later, one at a time."><fieldset><legend className="mb-4 text-sm font-medium text-slate-200">Where does your business show up?</legend><div className="grid gap-3 sm:grid-cols-2">{channels.map((channel) => <label key={channel} className={`flex cursor-pointer items-center gap-3 border px-4 py-3 text-sm transition-colors ${selectedChannels.includes(channel) ? "border-cyan-400 bg-cyan-400/10 text-white" : "border-slate-700 bg-[#0a0f1e] text-slate-300 hover:border-slate-500"}`}><input type="checkbox" checked={selectedChannels.includes(channel)} onChange={() => toggleChannel(channel)} className="size-4 accent-cyan-400" />{channel}</label>)}</div></fieldset><div className="mt-5 flex items-start gap-3 border-l-2 border-cyan-400 bg-cyan-400/5 p-4 text-sm leading-6 text-slate-300"><MapPinned size={18} className="mt-1 shrink-0 text-cyan-300" />Not every business needs every channel. MarketGrowthAI will prioritize the sources that make sense for your customers and goals.</div></StepContent>}
          <div className="mt-8 flex items-center justify-between border-t border-slate-800 pt-5">{step > 0 ? <button type="button" onClick={() => setStep((current) => current - 1)} className="text-sm font-semibold text-slate-400 hover:text-white">Back</button> : <span />}{step === steps.length - 1 ? <button disabled={isSaving} className="flex items-center gap-2 bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300">{isSaving ? "Preparing connections..." : "Continue to connections"}<Check size={17} /></button> : <button className="flex items-center gap-2 bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300">Continue<ArrowRight size={17} /></button>}</div>
        </form>
      </div>
    </div>
  );
}

function StepContent({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) { return <><div className="mb-6 flex items-start gap-3"><div className="flex size-10 items-center justify-center bg-cyan-400/10 text-cyan-300">{icon}</div><div><h2 className="text-xl font-bold text-white">{title}</h2><p className="mt-1 text-sm text-slate-400">{description}</p></div></div>{children}</>; }

function Field({ label, name, placeholder, value, onChange, type = "text", required }: { label: string; name: keyof BusinessProfile; placeholder: string; value: string; onChange: (name: keyof BusinessProfile, value: string) => void; type?: string; required?: boolean }) { return <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-200">{label}</span><input name={name} type={type} placeholder={placeholder} value={value} onChange={(event) => onChange(name, event.target.value)} required={required} className="w-full border border-slate-700 bg-[#0a0f1e] px-3 py-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-cyan-400" /></label>; }

function TextArea({ label, name, placeholder, value, onChange, required }: { label: string; name: keyof BusinessProfile; placeholder: string; value: string; onChange: (name: keyof BusinessProfile, value: string) => void; required?: boolean }) { return <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-200">{label}</span><textarea name={name} placeholder={placeholder} value={value} onChange={(event) => onChange(name, event.target.value)} required={required} rows={3} className="w-full resize-y border border-slate-700 bg-[#0a0f1e] px-3 py-3 text-sm leading-6 text-white outline-none transition-colors placeholder:text-slate-600 focus:border-cyan-400" /></label>; }