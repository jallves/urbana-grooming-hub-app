// src/components/ui/loader.tsx
import { Loader2 } from "lucide-react";
import React from "react";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  variant?: "spinner" | "dots";
}

export const Loader = ({ 
  size = "md", 
  className = "", 
  variant = "spinner" 
}: LoaderProps) => {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };

  if (variant === "dots") {
    return (
      <div className={`flex space-x-2 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={`bg-current rounded-full animate-bounce ${sizes[size]}`}
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    );
  }

  return (
    <Loader2
      className={`animate-spin ${sizes[size]} ${className}`}
      aria-hidden="true"
    />
  );
};
