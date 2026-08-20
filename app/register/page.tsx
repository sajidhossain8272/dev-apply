"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="animate-pulse text-xs text-neutral-400 font-mono">
        Redirecting to Sign In...
      </div>
    </div>
  );
}
