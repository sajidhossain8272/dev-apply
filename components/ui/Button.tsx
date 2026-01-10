"use client";

import * as React from "react";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
};

const base =
  "inline-flex items-center justify-center rounded-none text-xs uppercase tracking-widest font-bold transition-all duration-300 px-6 py-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default: "bg-white text-black hover:bg-neutral-200 active:scale-95",
  outline:
    "border border-neutral-800 bg-transparent text-white hover:bg-white hover:text-black active:scale-95",
  ghost: "text-neutral-400 hover:text-white hover:bg-neutral-900 active:scale-95",
};

// Light theme overrides (can be handled via CSS variables if needed, but staying consistent with variants)
const lightVariants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default: "bg-black text-white hover:bg-neutral-800",
  outline: "border border-neutral-200 bg-transparent text-black hover:bg-black hover:text-white",
  ghost: "text-neutral-600 hover:text-black hover:bg-neutral-100",
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
