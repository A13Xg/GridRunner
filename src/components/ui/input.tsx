import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full bg-transparent border border-[#1a1a3a] px-3 py-1 text-sm text-cyan-100 font-mono",
          "placeholder:text-[#4040a0] placeholder:tracking-widest",
          "focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_8px_rgba(0,255,255,0.25)]",
          "transition-all duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
