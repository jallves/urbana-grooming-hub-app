
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const AdminHeader: React.FC = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  
  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: 'Logout realizado',
        description: 'Você foi desconectado do sistema',
      });
    } catch (error) {
      toast({
        title: 'Erro ao fazer logout',
        description: 'Ocorreu um erro ao tentar desconectar',
        variant: 'destructive',
      });
    }
  };
  
  // Obter nome do usuário das metadados ou fallback para email
  const userName = user?.user_metadata?.full_name || user?.email || 'Admin';
  
  return (
    <header className="border-b bg-card p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">Painel Administrativo</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground hidden md:inline-block">
          {userName}
        </span>
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          Sair
        </Button>
      </div>
    </header>
  );
};

export default AdminHeader;
