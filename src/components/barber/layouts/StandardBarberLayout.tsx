
import React from 'react';

interface StandardBarberLayoutProps {
  children: React.ReactNode;
}

const StandardBarberLayout: React.FC<StandardBarberLayoutProps> = ({ children }) => {
  return (
    <div className="w-full h-full min-h-screen bg-gray-900">
      <div className="w-full h-full p-2 sm:p-4 lg:p-6">
        <div className="w-full h-full space-y-3 sm:space-y-4 lg:space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default StandardBarberLayout;
