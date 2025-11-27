
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StandardCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const StandardCard: React.FC<StandardCardProps> = ({ title, children, className = '', onClick }) => {
  const cardProps = onClick ? { onClick, className: `cursor-pointer ${className}` } : { className };

  return (
    <Card className={`w-full bg-urbana-black/40 backdrop-blur-2xl border border-urbana-gold/20 shadow-2xl shadow-urbana-black/50 ${cardProps.className}`} {...(onClick && { onClick })}>
      {title && (
        <CardHeader className="pb-0.5 px-1.5 sm:px-2 pt-1.5 sm:pt-2 border-b border-urbana-gold/10">
          <CardTitle className="text-[10px] sm:text-xs font-bold text-urbana-light">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-1.5 sm:p-2 flex flex-col h-full">
        {children}
      </CardContent>
    </Card>
  );
};

export default StandardCard;
