
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BarberCommissionsRedirect: React.FC = () => {
  const navigate = useNavigate();
  
  // Use a useEffect with empty dependency array to ensure navigation happens only once
  useEffect(() => {
    // Redirect to appointments page with commissions tab
    navigate('/barbeiro/agendamentos?tab=commissions', { replace: true });
  }, [navigate]); // Include navigate in dependencies
  
  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
    </div>
  );
};

export default BarberCommissionsRedirect;
