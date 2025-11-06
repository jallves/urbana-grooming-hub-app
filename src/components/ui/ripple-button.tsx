import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RippleEffect {
  x: number;
  y: number;
  id: number;
}

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export const RippleButton = React.forwardRef<HTMLButtonElement, RippleButtonProps>(
  ({ children, className, onClick, ...props }, ref) => {
    const [ripples, setRipples] = useState<RippleEffect[]>([]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newRipple: RippleEffect = {
        x,
        y,
        id: Date.now(),
      };

      setRipples((prev) => [...prev, newRipple]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples((prev) => prev.filter((ripple) => ripple.id !== newRipple.id));
      }, 600);

      if (onClick) {
        onClick(e);
      }
    };

    return (
      <button
        ref={ref}
        className={`relative overflow-hidden ${className}`}
        onClick={handleClick}
        {...props}
      >
        {children}
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.span
              key={ripple.id}
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ scale: 4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute rounded-full bg-white pointer-events-none"
              style={{
                left: ripple.x,
                top: ripple.y,
                width: 20,
                height: 20,
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </AnimatePresence>
      </button>
    );
  }
);

RippleButton.displayName = 'RippleButton';
