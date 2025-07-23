
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StandardCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const StandardCard: React.FC<StandardCardProps> = ({ title, children, className = '' }) => {
  return (
    <Card className={`w-full bg-gray-800/50 border-gray-700/50 backdrop-blur-sm ${className}`}>
      {title && (
        <CardHeader className="pb-3">
          <CardTitle className="text-lg sm:text-xl font-bold text-white">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-3 sm:p-4 lg:p-6">
        {children}
      </CardContent>
    </Card>
  );
};

export default StandardCard;
