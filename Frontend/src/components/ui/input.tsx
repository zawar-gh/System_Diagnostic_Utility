import * as React from "react";
import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Layout
        "flex h-9 w-full min-w-0 rounded-sm px-3 py-1 text-base md:text-sm outline-none transition-all duration-200",

        // Cyber-dark design
        "text-white placeholder:text-gray-400 border border-gray-600",
        "focus:border-red-500 focus-visible:ring-1 focus-visible:ring-red-500 focus:shadow-[0_0_8px_#ff000055]",
        "caret-white disabled:pointer-events-none disabled:opacity-50",

        className
      )}
      style={{
        backgroundColor: "#1a1a1a", // 🧱 applied instantly at render
        color: "white",             // ensures no flicker of black text
      }}
      {...props}
    />
  );
}

export { Input };
