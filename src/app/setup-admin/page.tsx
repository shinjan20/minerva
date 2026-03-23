"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { containsProfanity } from "@/lib/profanity";
import AuthLayout from "@/components/AuthLayout";

export default function AdminRegisterPage() {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [nameError, setNameError] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleNameChange = (val: string) => {
    setName(val);
    if (containsProfanity(val)) {
      setNameError("Please use appropriate language.");
    } else {
      setNameError("");
    }
  };

  const handleRequestOtp = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (nameError) return;

    // Local explicit verification for adding an admin
    if (secretCode !== (process.env.NEXT_PUBLIC_ADMIN_SETUP_SECRET || "minerva-admin-setup")) {
      setErrorMsg("Invalid Secure Setup Key provided. Access Denied.");
      toast.error("Invalid Secure Setup Key!");
      return;
    }
    
    if (!email.endsWith("@iiml.ac.in")) {
      setErrorMsg("Must use an official @iiml.ac.in email address");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success("Registration initiated. Check your email for OTP.");
        setErrorMsg("");
        setStep(2);
      } else {
        const msg = data.error || "Registration failed";
        toast.error(msg);
        setErrorMsg(msg);
      }
    } catch (err) {
      toast.error("Network error");
      setErrorMsg("Network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    
    try {
      const res = await fetch("/api/auth/register/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success("Office Staff Account verified successfully!");
        router.push("/dashboard");
      } else {
        const msg = data.error || "Verification failed";
        toast.error(msg);
        setErrorMsg(msg);
      }
    } catch (err) {
      toast.error("Network error");
      setErrorMsg("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Secure Setup" subtitle="Provision a new Office Staff account">
      {errorMsg && (
        <div className="mb-6 rounded-md bg-red-900/40 p-4 border border-red-500/50 animate-fade-in-up">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-200">{errorMsg}</h3>
            </div>
          </div>
        </div>
      )}
      {step === 1 ? (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300">Secure Setup Key <span className="text-red-400">*</span></label>
            <input required type="password" placeholder="Contact IT for setup key" className="mt-1 block w-full px-3 py-2 bg-red-900/20 border border-red-500/30 rounded text-red-100 placeholder-red-500/50 focus:outline-none focus:ring-red-500 focus:border-red-500 transition-colors" value={secretCode} onChange={e => setSecretCode(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">Full Name <span className="text-red-400">*</span></label>
            <input required type="text" className={`mt-1 block w-full px-3 py-2 bg-white/5 border ${nameError ? 'border-red-500' : 'border-white/10'} rounded text-white placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary transition-colors`} value={name} onChange={e => handleNameChange(e.target.value)} />
            {nameError && <p className="text-red-400 text-xs mt-1 text-left">{nameError}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">Official Email (@iiml.ac.in) <span className="text-red-400">*</span></label>
            <input required type="email" className="mt-1 block w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary transition-colors" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">Password <span className="text-red-400">*</span></label>
            <input required type="password" minLength={8} className="mt-1 block w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary transition-colors" value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          <button type="button" onClick={handleRequestOtp} disabled={loading || nameError.length > 0} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-[0_4px_14px_0_rgba(107,33,168,0.39)] text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none disabled:opacity-70 transition-all hover:scale-[1.02] active:scale-95">
            {loading ? "Processing..." : "Register & Get OTP"}
          </button>
          
          <div className="text-center pt-2">
            <a href="/login" className="text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors">
              Back to Login
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-blue-900/30 border-l-4 border-blue-500 p-4 rounded-md">
            <p className="text-sm text-blue-200">An OTP has been sent to <strong>{email}</strong>.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">Enter 6-Digit OTP <span className="text-red-400">*</span></label>
            <input required type="text" maxLength={6} className="mt-1 block w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-center text-xl tracking-widest text-white placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary transition-colors" value={otp} onChange={e => setOtp(e.target.value)} />
          </div>

          <button type="button" onClick={handleVerifyOtp} disabled={loading || otp.length !== 6} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-[0_4px_14px_0_rgba(107,33,168,0.39)] text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none disabled:opacity-70 transition-all hover:scale-[1.02] active:scale-95">
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
          
          <div className="text-center pt-2">
            <a href="/login" className="text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors">
              Back to Login
            </a>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
