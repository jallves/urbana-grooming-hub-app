
import React from 'react';

interface StandardBarberLayoutProps {
  children: React.ReactNode;
}

const StandardBarberLayout: React.FC<StandardBarberLayoutProps> = ({ children }) => {
  return (
    <div className="w-full h-full min-h-[calc(100vh-64px)]">
      <div className="w-full h-full">
        {children}
      </div>
    </div>
  );
};

export default StandardBarberLayout;
