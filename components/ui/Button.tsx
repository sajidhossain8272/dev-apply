"use client";

import * as React from "react";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
};

const base =
  "inline-flex items-center justify-center rounded-none text-xs uppercase tracking-widest font-bold transition-all duration-300 px-6 py-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default: "bg-[var(--fg)] text-[var(--bg)] hover:bg-neutral-200 dark:hover:bg-neutral-800 active:scale-95",
  outline:
    "border border-[var(--border)] bg-transparent text-[var(--fg)] hover:bg-[var(--fg)] hover:text-[var(--bg)] active:scale-95",
  ghost: "text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--surface)] active:scale-95",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    />
  )
);

Button.displayName = "Button";
