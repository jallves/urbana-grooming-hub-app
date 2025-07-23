
import React from 'react';

interface StandardBarberLayoutProps {
  children: React.ReactNode;
}

const StandardBarberLayout: React.FC<StandardBarberLayoutProps> = ({ children }) => {
  return (
    <div className="w-full h-full min-h-screen bg-gray-900">
      <div className="w-full h-full p-3 sm:p-4 lg:p-6">
        <div className="w-full h-full space-y-4 sm:space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default StandardBarberLayout;
