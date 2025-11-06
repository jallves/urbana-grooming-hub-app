import React from 'react';
import { motion } from 'framer-motion';

interface GoldenDividerProps {
  variant?: 'simple' | 'ornate' | 'geometric';
}

export const GoldenDivider: React.FC<GoldenDividerProps> = ({ variant = 'simple' }) => {
  if (variant === 'ornate') {
    return (
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        viewport={{ once: true }}
        className="flex items-center justify-center my-12 md:my-16"
      >
        <div className="h-px w-20 bg-gradient-to-r from-transparent via-urbana-gold to-transparent" />
        <div className="mx-4 flex items-center gap-2">
          <div className="w-2 h-2 rotate-45 bg-urbana-gold shadow-[0_0_10px_rgba(255,215,0,0.6)]" />
          <div className="w-3 h-3 rotate-45 bg-gradient-to-br from-urbana-gold to-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.7)]" />
          <div className="w-2 h-2 rotate-45 bg-urbana-gold shadow-[0_0_10px_rgba(255,215,0,0.6)]" />
        </div>
        <div className="h-px w-20 bg-gradient-to-r from-urbana-gold via-transparent to-transparent" />
      </motion.div>
    );
  }

  if (variant === 'geometric') {
    return (
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        viewport={{ once: true }}
        className="flex items-center justify-center my-12 md:my-16 gap-3"
      >
        <div className="flex gap-1">
          <div className="w-1 h-8 bg-urbana-gold/30" />
          <div className="w-1 h-12 bg-urbana-gold/50" />
          <div className="w-1 h-16 bg-urbana-gold shadow-[0_0_10px_rgba(255,215,0,0.5)]" />
          <div className="w-1 h-12 bg-urbana-gold/50" />
          <div className="w-1 h-8 bg-urbana-gold/30" />
        </div>
        <div className="h-px w-32 bg-gradient-to-r from-urbana-gold via-yellow-400 to-urbana-gold shadow-[0_0_8px_rgba(255,215,0,0.4)]" />
        <div className="flex gap-1">
          <div className="w-1 h-8 bg-urbana-gold/30" />
          <div className="w-1 h-12 bg-urbana-gold/50" />
          <div className="w-1 h-16 bg-urbana-gold shadow-[0_0_10px_rgba(255,215,0,0.5)]" />
          <div className="w-1 h-12 bg-urbana-gold/50" />
          <div className="w-1 h-8 bg-urbana-gold/30" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      whileInView={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true }}
      className="h-px w-full max-w-xs mx-auto my-12 bg-gradient-to-r from-transparent via-urbana-gold to-transparent shadow-[0_0_10px_rgba(255,215,0,0.5)]"
    />
  );
};
