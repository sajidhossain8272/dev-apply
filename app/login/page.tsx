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

        {/* Email OTP Sign-In Form */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 space-y-6 shadow-2xl backdrop-blur-md">
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
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
                className="w-full bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-black font-extrabold text-xs py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
              >
                {sendingOtp ? (
                  <>
                    <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-black"></span>
                    <span>Sending 6-Digit Code...</span>
                  </>
                ) : (
                  <span>Send 6-Digit Verification Code</span>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  Enter 6-Digit OTP Code sent to <span className="text-emerald-400">{email}</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-widest text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtpCode("");
                  }}
                  className="w-1/3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs py-3 rounded-xl transition-all"
                >
                  Change Email
                </button>
                <button
                  type="submit"
                  disabled={verifyingOtp || otpCode.length < 6}
                  className="w-2/3 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-black font-extrabold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {verifyingOtp ? (
                    <>
                      <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-black"></span>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Verify & Sign In</span>
                  )}
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
