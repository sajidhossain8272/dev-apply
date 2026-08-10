"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 selection:bg-emerald-500 selection:text-black">
      <div className="w-full max-w-md space-y-8 relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-2xl font-black mb-2">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Create Your Dev-Apply Account
        </h1>
        <p className="text-sm text-neutral-400">
          Join as a Developer (Apply & Build Portfolio) or Client (Post Jobs & Hire Engineers)
        </p>

        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 space-y-6 shadow-2xl backdrop-blur-md">
          <button
            onClick={() => signIn("github", { callbackUrl: "/dashboard/onboarding" })}
            className="w-full bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-sm py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>REGISTER WITH GITHUB (1-CLICK)</span>
          </button>

          <div className="pt-2">
            <Link
              href="/login"
              className="block w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs py-3 rounded-xl transition-all"
            >
              Register with Email & OTP Code
            </Link>
          </div>
        </div>

        <p className="text-xs text-neutral-500">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-400 hover:underline font-bold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
