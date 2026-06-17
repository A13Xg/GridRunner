"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 font-mono tracking-widest uppercase",
  {
    variants: {
      variant: {
        default:
          "bg-transparent border border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 hover:shadow-[0_0_12px_rgba(0,255,255,0.4)]",
        destructive:
          "bg-transparent border border-red-500 text-red-500 hover:bg-red-500/10",
        ghost:
          "text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/5",
        neon:
          "bg-cyan-400/10 border border-cyan-400 text-cyan-400 shadow-[0_0_8px_rgba(0,255,255,0.3)] hover:shadow-[0_0_16px_rgba(0,255,255,0.5)] hover:bg-cyan-400/20",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-7 px-3 text-xs",
        lg: "h-11 px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
