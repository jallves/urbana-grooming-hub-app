
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import { Shield } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useShopSettings } from '@/hooks/useShopSettings';

const Navbar: React.FC = () => {
  const { user, isAdmin, signOut } = useAuth();
  const { toast } = useToast();
  const [scrolled, setScrolled] = useState(false);
  const { shopSettings } = useShopSettings();
  
  // Effect to detect scrolling and add shadow/background when scrolled
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

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

  // Use shop name from settings or fallback to default
  const shopName = shopSettings?.shop_name || "Barbearia Costa Urbana";

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white shadow-md' : 'bg-white/95 shadow'
    }`}>
      <div className="container mx-auto py-4 px-5 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-primary">
          {shopName}
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
                    <Shield size={20} />
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
                <Link to="/auth" className="hover:text-primary transition-colors" title="Admin">
                  <Shield size={20} />
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
