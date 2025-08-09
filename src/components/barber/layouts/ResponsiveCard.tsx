
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ResponsiveCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

const ResponsiveCard: React.FC<ResponsiveCardProps> = ({ 
  title, 
  children, 
  className,
  contentClassName 
}) => {
  return (
    <Card className={cn(
      "w-full bg-sidebar border-sidebar-border shadow-lg",
      className
    )}>
      {title && (
        <CardHeader className="pb-2 px-3 py-3 sm:px-4 sm:py-4">
          <CardTitle className="text-sm sm:text-base font-semibold text-sidebar-primary">
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn(
        "p-3 sm:p-4",
        !title && "pt-3 sm:pt-4",
        contentClassName
      )}>
        {children}
      </CardContent>
    </Card>
  );
};

export default ResponsiveCard;
