"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSendingOtp(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP verification code.");

      setOtpSent(true);
      setMessage(data.message || "6-digit OTP code sent to your email!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !otpCode.trim()) return;

    setVerifyingOtp(true);
    setError(null);

    try {
      const res = await signIn("email-otp", {
        email,
        code: otpCode,
        redirect: false,
      });

      if (res?.error) {
        throw new Error(res.error || "Invalid or expired OTP code.");
      }

      router.push(callbackUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 selection:bg-emerald-500 selection:text-black">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-2xl font-black mb-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Welcome to Dev-Apply
          </h1>
          <p className="text-sm text-neutral-400">
            Sign in to access your Developer & Client SaaS Command Center
          </p>
        </div>

        {/* Alerts */}
        {(error || oauthError) && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs font-semibold space-y-1">
            <p className="font-bold text-red-400">Sign In Error:</p>
            <p>
              {error ||
                (oauthError === "OAuthSignin"
                  ? "Google OAuth setup required: Ensure GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET are configured in your deployment settings, or sign in via GitHub or Email OTP."
                  : `OAuth authentication error (${oauthError}). Please try again.`)}
            </p>
          </div>
        )}
        {message && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs font-semibold">
            {message}
          </div>
        )}

        {/* Priority 1-Click OAuth */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 space-y-6 shadow-2xl backdrop-blur-md">
          <div className="space-y-3">
            <button
              onClick={() => signIn("github", { callbackUrl })}
              className="w-full bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-sm py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>SIGN IN WITH GITHUB (RECOMMENDED)</span>
            </button>

            <button
              onClick={() => signIn("google", { callbackUrl })}
              className="w-full bg-white hover:bg-neutral-100 text-black font-extrabold text-sm py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>SIGN IN WITH GOOGLE & GMAIL</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-neutral-800 w-full"></div>
            <span className="bg-neutral-900 px-3 text-[10px] uppercase font-bold text-neutral-500 absolute">
              or sign in with email & otp
            </span>
          </div>

          {/* Email OTP Form */}
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={sendingOtp || !email.trim()}
                className="w-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl transition-all"
              >
                {sendingOtp ? "Sending Verification Code..." : "Send 6-Digit OTP Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1.5">
                  Enter 6-Digit OTP Code sent to {email}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-widest text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="w-1/3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs py-3 rounded-xl transition-all"
                >
                  Change Email
                </button>
                <button
                  type="submit"
                  disabled={verifyingOtp || otpCode.length < 6}
                  className="w-2/3 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-black font-extrabold text-xs py-3 rounded-xl transition-all"
                >
                  {verifyingOtp ? "Verifying..." : "Verify & Log In"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-neutral-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-emerald-400 hover:underline font-bold">
            Register Here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center p-6 text-xs text-neutral-400">Loading Login...</div>}>
      <LoginContent />
    </Suspense>
  );
}
