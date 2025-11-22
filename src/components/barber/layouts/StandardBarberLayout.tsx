
import React from 'react';

interface StandardBarberLayoutProps {
  children: React.ReactNode;
}

const StandardBarberLayout: React.FC<StandardBarberLayoutProps> = ({ children }) => {
  return (
    <div className="w-full md:px-6 lg:px-8 py-4 sm:py-6">
      {children}
    </div>
  );
};

export default StandardBarberLayout;
