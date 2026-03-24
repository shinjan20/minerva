"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import AuthLayout from "@/components/AuthLayout";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"request" | "reset">("request");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const router = useRouter();

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        toast.success("If an account exists, an OTP has been sent.");
        setStep("reset");
      } else {
        console.error("Forgot password request failed:", data);
        toast.error(data.error || "Failed to process request");
        setErrorMsg(data.error || "Failed to process request");
      }
    } catch (err: any) {
      console.error("Network error in forgot password:", err);
      toast.error("Network error");
      setErrorMsg("Network error occurred: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Password reset successful. You can now login.");
        router.push("/login");
      } else {
        const msg = data.error || "Password reset failed";
        toast.error(msg);
        setErrorMsg(msg);
      }
    } catch (err) {
      toast.error("Network error");
      setErrorMsg("Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Account Security" subtitle={step === "request" ? "Initialize or recover your academic account" : "Authorize Password Reset"}>
      {errorMsg && (
        <div className="mb-8 rounded-2xl bg-red-500/10 p-5 border border-red-500/20 animate-fade-in-up">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
               <span className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 font-bold">!</span>
            </div>
            <div className="flex-1">
              <h3 className="text-[11px] font-black text-red-400 uppercase tracking-widest leading-loose">{errorMsg}</h3>
            </div>
          </div>
        </div>
      )}
      
      {step === "request" ? (
        <form className="space-y-8" onSubmit={handleRequest}>
          <div className="space-y-3">
             <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[.2em] pl-1">College Email Address</label>
             <input
              type="email"
              required
              className="appearance-none rounded-[1.25rem] w-full px-6 py-4 bg-white/[0.03] border border-white/[0.1] placeholder-slate-700 text-white focus:outline-none focus:border-blue-500/50 transition-all font-bold"
              placeholder="e.g. pgp41059@iiml.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-5 px-6 border border-transparent text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl text-white bg-blue-600 hover:bg-blue-500 transition-all hover:scale-[1.02] active:scale-95 shadow-[0_12px_24px_rgba(37,99,235,0.3)] disabled:opacity-50"
            >
              {loading ? "Initializing..." : "Send Verification Code"}
            </button>
          </div>
          
          <div className="text-center pt-4">
            <a href="/login" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-blue-400 transition-all">
              ← Return to Login
            </a>
          </div>
        </form>
      ) : (
        <form className="space-y-8" onSubmit={handleReset}>
          <div className="space-y-8">
            <div className="space-y-3 text-center">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[.3em] mb-4">Verification PIN</label>
              <input
                type="text"
                required
                className="appearance-none tracking-[0.5em] text-4xl font-black rounded-3xl w-full px-4 py-8 bg-white/[0.03] border border-white/[0.1] placeholder-slate-900 text-white focus:outline-none focus:border-blue-500/50 text-center transition-all shadow-inner"
                placeholder="------"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                maxLength={6}
              />
              <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-4">Check your email for the 6-digit code</p>
            </div>
            <div className="space-y-3">
               <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[.2em] pl-1">New Terminal Password</label>
               <input
                type="password"
                required
                className="appearance-none rounded-[1.25rem] w-full px-6 py-4 bg-white/[0.03] border border-white/[0.1] placeholder-slate-700 text-white focus:outline-none focus:border-blue-500/50 transition-all font-bold"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                aria-label="New Terminal Password"
              />
               <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-2 px-1">Must be at least 8 characters long</p>
            </div>
          </div>
          <div className="pt-6">
            <button
              type="submit"
              disabled={loading || otp.length !== 6 || newPassword.length < 8}
              className="w-full flex justify-center py-5 px-6 border border-transparent text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl text-white bg-emerald-600 hover:bg-emerald-500 transition-all hover:scale-[1.02] active:scale-95 shadow-[0_12px_24px_rgba(16,185,129,0.3)]"
            >
              {loading ? "Overwriting..." : "Register Credentials"}
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
