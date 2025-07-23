
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
    <Card className={`w-full bg-gray-800/50 border-gray-700/50 backdrop-blur-sm ${cardProps.className}`} {...(onClick && { onClick })}>
      {title && (
        <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4 lg:pt-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl font-bold text-white">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-3 sm:p-4 lg:p-6">
        {children}
      </CardContent>
    </Card>
  );
};

export default StandardCard;
