
import React from "react";

interface FormCardProps {
  children: React.ReactNode;
}

export function FormCard({ children }: FormCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 md:p-8 shadow-2xl">
      {children}
    </div>
  );
}
