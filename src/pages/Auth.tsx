
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Home, Scissors, Shield, User, LogIn } from 'lucide-react';
import AuthContainer from '@/components/ui/containers/AuthContainer';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, isAdmin, loading: authLoading } = useAuth();

  // Redireciona admin para o painel, outros para home
  useEffect(() => {
    if (!authLoading && user) {
      if (isAdmin) {
        navigate('/admin', { replace: true });
      } else if (!location.state?.from) {
        navigate('/', { replace: true });
      }
    }
  }, [user, isAdmin, navigate, authLoading, location.state]);

  // Credenciais de admin removidas por segurança
  // Use o Supabase Dashboard para criar usuários admin manualmente

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-urbana-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <AuthContainer 
      title="Costa Urbana"
      subtitle="Painel Administrativo"
    >
      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-xl mb-6">
          <TabsTrigger 
            value="login" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-urbana-gold data-[state=active]:to-yellow-500 data-[state=active]:text-black data-[state=active]:shadow-lg rounded-lg transition-all text-gray-700"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Login
          </TabsTrigger>
          <TabsTrigger 
            value="register" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-urbana-gold data-[state=active]:to-yellow-500 data-[state=active]:text-black data-[state=active]:shadow-lg rounded-lg transition-all text-gray-700"
          >
            <User className="h-4 w-4 mr-2" />
            Cadastro
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="login" className="mt-0">
          <LoginForm loading={loading} setLoading={setLoading} />
        </TabsContent>
        
        <TabsContent value="register" className="mt-0">
          <RegisterForm loading={loading} setLoading={setLoading} />
        </TabsContent>
      </Tabs>

      <Button
        variant="outline"
        className="w-full mt-6 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-urbana-gold h-12 rounded-xl transition-all"
        onClick={handleGoHome}
      >
        <Home className="h-4 w-4 mr-2" />
        Voltar ao site
      </Button>
    </AuthContainer>
  );
};

export default Auth;
