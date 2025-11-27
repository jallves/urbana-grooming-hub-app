import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const AdminHeader: React.FC = () => {
  const { user, signOut } = useAuth();
  
  const handleSignOut = async () => {
    await signOut();
  };
  
  const userName = user?.user_metadata?.full_name || user?.email || 'Admin';
  
  return (
    <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold text-gray-900">Painel Administrativo</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600 hidden md:inline-block">
          {userName}
        </span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSignOut}
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Sair
        </Button>
      </div>
    </header>
  );
};

export default AdminHeader;
