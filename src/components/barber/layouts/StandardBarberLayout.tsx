
import React from 'react';

interface StandardBarberLayoutProps {
  children: React.ReactNode;
}

const StandardBarberLayout: React.FC<StandardBarberLayoutProps> = ({ children }) => {
  return (
    <div className="w-full h-full min-h-screen bg-gray-900">
      <div className="w-full h-full p-0 sm:p-2 lg:p-4">
        <div className="w-full h-full space-y-2 sm:space-y-3 lg:space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default StandardBarberLayout;
