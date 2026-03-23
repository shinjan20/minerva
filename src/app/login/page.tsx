"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import AuthLayout from "@/components/AuthLayout";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Login successful!");
        router.push("/dashboard");
      } else {
        if (data.requiresRegistration) {
          toast.error(data.error);
          router.push(`/register/student?email=${encodeURIComponent(email)}`);
        } else {
          const msg = data.error || "Login failed";
          toast.error(msg);
          setErrorMsg(msg);
        }
      }
    } catch (err) {
      toast.error("Network error occurred");
      setErrorMsg("Network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Account Login" subtitle="Access your Minerva Dashboard">
      <div className="space-y-6">
        {errorMsg && (
          <div className="rounded-md bg-red-900/40 p-4 border border-red-500/50 animate-fade-in-up">
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
        <div className="rounded-md shadow-sm space-y-4">
          <div>
             <label htmlFor="email-address" className="sr-only">Email address</label>
             <input
               id="email-address"
               name="email"
               type="email"
               autoComplete="email"
               required
               className="appearance-none rounded relative block w-full px-3 py-2 bg-white/40 border border-gray-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm transition-colors"
               placeholder="College Email Address (@iiml.ac.in) *"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleLogin(e as any)}
             />
          </div>
          <div>
             <label htmlFor="password" className="sr-only">Password</label>
             <input
               id="password"
               name="password"
               type="password"
               autoComplete="current-password"
               required
               className="appearance-none rounded relative block w-full px-3 py-2 bg-white/40 border border-gray-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm transition-colors"
               placeholder="Password *"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleLogin(e as any)}
             />
          </div>
        </div>

        <div className="flex items-center justify-end">
          <div className="text-sm">
            <a href="/forgot-password" className="font-medium text-primary-400 hover:text-primary-300 transition-colors">
              Forgot your password?
            </a>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 transition-all hover:scale-[1.02] active:scale-95 shadow-[0_4px_14px_0_rgba(107,33,168,0.39)] hover:shadow-[0_6px_20px_rgba(107,33,168,0.23)]"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
