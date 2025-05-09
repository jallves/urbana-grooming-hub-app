
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Navbar: React.FC = () => {
  const { user, isAdmin, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado com sucesso",
        description: "Você foi desconectado do sistema.",
      });
    } catch (error) {
      toast({
        title: "Erro ao fazer logout",
        description: "Ocorreu um erro ao tentar desconectar.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-white shadow">
      <div className="container mx-auto py-4 px-5 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-primary">
          Urbana Barbearia
        </Link>
        <nav>
          <ul className="flex items-center space-x-6">
            <li>
              <a href="#" className="hover:text-primary transition-colors">
                Home
              </a>
            </li>
            <li>
              <a href="#services" className="hover:text-primary transition-colors">
                Serviços
              </a>
            </li>
            <li>
              <a href="#team" className="hover:text-primary transition-colors">
                Equipe
              </a>
            </li>
            <li>
              <a href="#appointment" className="hover:text-primary transition-colors">
                Contato
              </a>
            </li>
            {user ? (
              <>
                <li>
                  <Link 
                    to={isAdmin ? "/admin" : "/auth"} 
                    className="hover:text-primary transition-colors"
                    title={isAdmin ? "Acessar painel admin" : "Autenticação necessária"}
                  >
                    Admin
                  </Link>
                </li>
                <li>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    Logout
                  </Button>
                </li>
              </>
            ) : (
              <li>
                <Link to="/auth" className="hover:text-primary transition-colors">
                  Admin
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Navbar;
