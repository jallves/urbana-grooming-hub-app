
import React from 'react';

interface StandardBarberLayoutProps {
  children: React.ReactNode;
}

const StandardBarberLayout: React.FC<StandardBarberLayoutProps> = ({ children }) => {
  return (
    <div className="w-full h-full flex-1 flex flex-col">
      <div className="w-full h-full flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
};

export default StandardBarberLayout;
