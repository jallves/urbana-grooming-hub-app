import React from 'react';
import { cn } from '@/lib/utils';

interface NoHoverLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const NoHoverLayout: React.FC<NoHoverLayoutProps> = ({ children, className }) => {
  return (
    <div 
      className={cn(
        "dashboard-container cursor-default select-none",
        className
      )}
      style={{
        /* Remove all hover effects from dashboard areas */
        pointerEvents: 'auto'
      }}
    >
      <style>{`
        .dashboard-container * {
          transition: none !important;
        }
        .dashboard-container *:hover {
          transform: none !important;
          background-color: inherit !important;
          color: inherit !important;
          border-color: inherit !important;
          opacity: inherit !important;
          scale: none !important;
        }
      `}</style>
      {children}
    </div>
  );
};

export default NoHoverLayout;