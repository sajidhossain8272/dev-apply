"use client";

import * as React from "react";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
};

const base =
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition px-3.5 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default: "bg-sky-500 text-white hover:bg-sky-400",
  outline:
    "border border-slate-700 bg-bg text-slate-50 hover:bg-slate-900/60",
  ghost: "text-slate-300 hover:bg-slate-800/80",
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
