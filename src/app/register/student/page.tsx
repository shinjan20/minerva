"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import AuthLayout from "@/components/AuthLayout";
import { fireConfetti } from "@/lib/confetti";

function StudentRegistrationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email");

  const [step, setStep] = useState<"email" | "otp" | "password">("email");
  const [email, setEmail] = useState(emailParam || "");
  const [studentInfo, setStudentInfo] = useState<any>(null);
  
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingInfo, setFetchingInfo] = useState(!!emailParam);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  useEffect(() => {
    if (emailParam) {
      fetchStudentInfo(emailParam);
    }
  }, [emailParam]);

  const fetchStudentInfo = async (targetEmail: string) => {
    setFetchingInfo(true);
    try {
      const res = await fetch(`/api/students/info?email=${encodeURIComponent(targetEmail)}`);
      const data = await res.json();
      if (res.ok && data.student) {
        setStudentInfo(data.student);
        setStep("otp");
      } else {
        toast.error(data.error || "Could not find your student record.");
      }
    } catch (e) {
      toast.error("Network error fetching student data.");
    } finally {
      setFetchingInfo(false);
    }
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: "", color: "bg-white/10", width: "w-0" };
    
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[a-zA-Z]/.test(pass) && /[0-9]/.test(pass)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pass) || (/[A-Z]/.test(pass) && /[a-z]/.test(pass))) score += 1;

    if (pass.length < 8 || score < 2) {
      return { label: "Weak (Requires min 8 alphanumeric chars)", color: "bg-red-500", text: "text-red-400", width: "w-1/3" };
    }

    if (score === 3) return { label: "Strong", color: "bg-green-500", text: "text-green-400", width: "w-full" };
    return { label: "Medium", color: "bg-yellow-500", text: "text-yellow-400", width: "w-2/3" };
  };

  const handleValidateOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentInfo || !email || otp.length !== 6) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register/student/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }), // Intentionally omitting password
      });
      
      const data = await res.json();
      
      if (res.ok && data.valid_otp) {
        toast.success("OTP Verified! Please set your new password.");
        setStep("password");
      } else {
        toast.error(data.error || "Invalid OTP entered.");
      }
    } catch (err) {
      toast.error("Network error while verifying OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentInfo || !email) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register/student/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setRegistrationComplete(true);
        fireConfetti();
      } else {
        toast.error(data.error || "Verification failed. Check your OTP.");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(password);
  const isPasswordValid = password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);

  if (fetchingInfo) {
    return (
      <AuthLayout title="Student Verification" subtitle="Loading your profile data...">
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthLayout>
    );
  }

  const getSubtitle = () => {
    if (step === "email") return "Lookup your student profile securely.";
    if (step === "otp") return "Verify your Office-issued Identity.";
    return "Set a strong alphanumeric password to complete registration.";
  };

  return (
    <AuthLayout title="Student Verification" subtitle={getSubtitle()}>
      {step === "email" && (
        <form className="mt-8 space-y-6" onSubmit={(e) => { e.preventDefault(); fetchStudentInfo(email); }}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <input 
                required 
                type="email" 
                placeholder="College Email Address *"
                className="appearance-none rounded w-full px-3 py-3 bg-white/40 border border-gray-200 placeholder-gray-400 text-slate-900 dark:text-white focus:outline-none focus:ring-primary focus:border-primary transition-colors" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                aria-label="College Email Address"
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 transition-all hover:scale-[1.02] active:scale-95 shadow-[0_4px_14px_0_rgba(107,33,168,0.39)]"
          >
            {loading ? "Looking up..." : "Continue"}
          </button>
        </form>
      )}

      {step === "otp" && (
        <form className="mt-8 space-y-6 animate-fade-in" onSubmit={handleValidateOTP}>
            {/* Premium Identity Card */}
            <div className="relative overflow-hidden bg-slate-900/40 dark:bg-black/40 border border-white/10 backdrop-blur-xl p-6 rounded-3xl group transition-all duration-300 hover:border-blue-500/30 shadow-2xl">
              {/* Decorative accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-blue-600/10 transition-all" />
              
              <div className="relative space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Verified Student Data</span>
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{studentInfo.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Academic ID</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white font-[Orbitron] tracking-widest">{studentInfo.student_id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Section</p>
                    <p className="text-sm font-black text-blue-600 dark:text-blue-400">SECTION {studentInfo.section}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Context</p>
                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">{studentInfo.email}</p>
                  </div>
                </div>

                <p className="text-[9px] text-slate-500/70 pt-4 border-t border-white/5 italic">
                  * Pre-verified records by Office Administration.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] text-center">Enter 6-Digit Secure OTP</label>
              <div className="relative group">
                <input 
                  required 
                  type="text" 
                  maxLength={6} 
                  className="appearance-none rounded-2xl w-full px-4 py-5 bg-white/5 border border-white/10 text-center text-4xl tracking-[0.4em] font-mono placeholder-white/5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all shadow-inner" 
                  value={otp} 
                  onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))} 
                  placeholder="000000" 
                  aria-label="Verification OTP"
                />
                <div className="absolute inset-0 rounded-2xl bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            </div>

          <button 
            type="submit" 
            disabled={otp.length !== 6 || loading} 
            className="w-full relative overflow-hidden group flex justify-center py-4 px-4 border border-transparent text-xs font-black uppercase tracking-[0.3em] rounded-2xl text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-95 shadow-[0_10px_20px_-10px_rgba(37,99,235,0.5)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative">
              {loading ? "Decrypting Token..." : "Validate Identity"}
            </span>
          </button>
        </form>
      )}

      {step === "password" && (
        <form className="mt-8 space-y-6 animate-fade-in" onSubmit={handleVerifyOTP}>
          <button type="button" onClick={() => setStep("otp")} className="text-sm text-primary-600 hover:text-primary-700 hover:underline mb-2 transition-colors">
            &larr; Back to Profile Verification
          </button>
          
          <div>
            <input 
              required 
              type="password" 
              minLength={8} 
              className="appearance-none rounded w-full px-3 py-3 bg-white/40 border border-gray-200 placeholder-gray-400 text-slate-900 dark:text-white focus:outline-none focus:ring-primary focus:border-primary transition-colors" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Set Password (Alphanumeric, Min 8 chars)" 
              aria-label="Set Registration Password"
            />
            
            {password.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center h-1.5 overflow-hidden rounded bg-white/10">
                  <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300`}></div>
                </div>
                {strength.label && (
                  <p className={`mt-2 flex items-center text-xs font-medium ${strength.text}`}>
                    {strength.label}
                  </p>
                )}
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading || !isPasswordValid} 
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 transition-all hover:scale-[1.02] active:scale-95 shadow-[0_4px_14px_0_rgba(22,163,74,0.39)]"
          >
            {loading ? "Verifying..." : "Verify Identity & Login"}
          </button>
        </form>
      )}

      {/* Congratulatory Full-Screen Modal */}
      {registrationComplete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-xl p-4 animate-fade-in text-center">
          <div className="bg-white/[0.06] border border-white/[0.1] backdrop-blur-3xl rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] p-10 flex flex-col items-center justify-center animate-scale-up max-w-md w-full relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />
            
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-emerald-400/30 blur-2xl animate-pulse rounded-full" />
              <div className="relative w-full h-full rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            
            <h3 className="text-3xl font-black text-white tracking-tight mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Welcome to Minerva!</h3>
            <p className="text-slate-400 leading-relaxed text-sm">
              Congratulations, <span className="text-white font-bold">{studentInfo?.name}</span>. Your identity is verified and your academic profile is synced for this term.
            </p>
            
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-8 w-full py-3.5 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-[0_0_24px_rgba(124,58,237,0.4)] hover:shadow-[0_0_36px_rgba(124,58,237,0.6)] transition-all flex justify-center items-center gap-2"
            >
              Enter Dashboard →
            </button>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}

export default function StudentRegistration() {
  return (
    <Suspense fallback={
      <AuthLayout title="Student Verification" subtitle="Loading...">
        <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
      </AuthLayout>
    }>
      <StudentRegistrationForm />
    </Suspense>
  );
}
