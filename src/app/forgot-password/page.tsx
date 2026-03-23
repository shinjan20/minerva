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

      if (res.ok) {
        toast.success("If an account exists, an OTP has been sent.");
        setStep("reset");
      } else {
        toast.error("Failed to process request");
        setErrorMsg("Failed to process request");
      }
    } catch (err) {
      toast.error("Network error");
      setErrorMsg("Network error occurred.");
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
    <AuthLayout title="Password Recovery" subtitle={step === "request" ? "Enter your email to reset password" : "Enter Verification OTP"}>
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
      
      {step === "request" ? (
        <form className="space-y-6" onSubmit={handleRequest}>
          <div>
            <input
              type="email"
              required
              className="appearance-none rounded w-full px-3 py-2 bg-white/5 border border-white/10 placeholder-gray-400 text-white focus:outline-none focus:ring-primary focus:border-primary transition-colors"
              placeholder="Account Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 transition-all hover:scale-[1.02] active:scale-95 shadow-[0_4px_14px_0_rgba(107,33,168,0.39)] hover:shadow-[0_6px_20px_rgba(107,33,168,0.23)]"
            >
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </div>
          
          <div className="text-center">
            <a href="/login" className="text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors">
              Back to Login
            </a>
          </div>
        </form>
      ) : (
        <form className="space-y-6" onSubmit={handleReset}>
          <div className="space-y-4">
            <input
              type="text"
              required
              className="appearance-none tracking-widest text-xl rounded w-full px-3 py-2 bg-white/5 border border-white/10 placeholder-gray-500 text-white focus:outline-none focus:ring-primary focus:border-primary text-center transition-colors"
              placeholder="6-Digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
            />
            <input
              type="password"
              required
              className="appearance-none rounded w-full px-3 py-2 bg-white/5 border border-white/10 placeholder-gray-400 text-white focus:outline-none focus:ring-primary focus:border-primary transition-colors"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6 || newPassword.length < 6}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 transition-all hover:scale-[1.02] active:scale-95 shadow-[0_4px_14px_0_rgba(107,33,168,0.39)] hover:shadow-[0_6px_20px_rgba(107,33,168,0.23)]"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
