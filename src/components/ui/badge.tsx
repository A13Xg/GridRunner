import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center px-2 py-0.5 text-[10px] font-mono tracking-widest uppercase border",
  {
    variants: {
      variant: {
        default: "border-cyan-400/40 text-cyan-400 bg-cyan-400/5",
        queued: "border-[#4040a0] text-[#6060c0] bg-[#0a0a20]",
        in_progress: "border-cyan-400 text-cyan-400 bg-cyan-400/10",
        completed: "border-green-400/60 text-green-400 bg-green-400/5",
        failed: "border-red-500/60 text-red-400 bg-red-500/5",
        skipped: "border-[#303060] text-[#505080] bg-[#0a0a20]",
        idle: "border-[#4040a0] text-[#6060c0] bg-transparent",
        moving: "border-yellow-400 text-yellow-400 bg-yellow-400/10",
        working: "border-cyan-400 text-cyan-400 bg-cyan-400/10 animate-pulse",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
