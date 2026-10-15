import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "pink" | "slate" | "success" | "outline" | "glow";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "pink",
  size = "md",
  children,
  ...props
}) => {
  const variantStyles = {
    pink: "bg-pink-500/15 text-pink-400 border border-pink-500/30",
    slate: "bg-slate-800/60 text-slate-300 border border-slate-700/50",
    success: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    outline: "bg-transparent text-slate-300 border border-[#2B3248]",
    glow: "bg-gradient-to-r from-pink-500/15 to-purple-500/15 text-pink-300 border border-pink-500/40 shadow-[0_0_15px_-3px_rgba(236,72,153,0.2)]",
  };

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 font-medium",
    md: "text-xs px-2.5 py-1 font-medium",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full tracking-wide select-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
