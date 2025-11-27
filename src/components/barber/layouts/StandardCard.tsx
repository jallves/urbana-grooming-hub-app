
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
        <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4 border-b border-urbana-gold/10">
          <CardTitle className="text-sm sm:text-base font-bold text-urbana-light">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-3 sm:p-4 flex flex-col h-full">
        {children}
      </CardContent>
    </Card>
  );
};

export default StandardCard;
