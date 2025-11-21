
import React from 'react';

interface StandardBarberLayoutProps {
  children: React.ReactNode;
}

const StandardBarberLayout: React.FC<StandardBarberLayoutProps> = ({ children }) => {
  return (
    <div className="w-full flex-1 flex flex-col min-h-0">
      {children}
    </div>
  );
};

export default StandardBarberLayout;
