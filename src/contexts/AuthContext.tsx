import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Home, Scissors } from 'lucide-react';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, isAdmin, loading: authLoading } = useAuth();

  const from = location.state?.from || "/admin";

  // Redirecionamento automático para rota protegida caso já esteja logado
  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      navigate(from, { replace: true });
    }
  }, [user, isAdmin, navigate, authLoading, from]);

  // Criar usuário admin (somente em ambiente de desenvolvimento)
  useEffect(() => {
    const createAdminUser = async () => {
      if (authLoading || user || process.env.NODE_ENV === 'production') return;

      try {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('email', 'joao.colimoides@gmail.com')
          .single();

        if (!existingUser) {
          const { data: signUpData } = await supabase.auth.signUp({
            email: 'joao.colimoides@gmail.com',
            password: 'Jb74872701@',
            options: { data: { full_name: 'João Alves Da Silva' } }
          });

          if (signUpData?.user) {
            await supabase.from('user_roles').insert([{
              user_id: signUpData.user.id,
              role: 'admin'
            }]);

            toast({
              title: "Usuário administrador criado",
              description: "Use joao.colimoides@gmail.com para login de admin",
            });
          }
        }
      } catch (error) {
        console.error('Erro ao criar admin:', error);
      }
    };

    createAdminUser();
  }, [authLoading, user, toast]);

  // Tela de carregamento
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mb-4"></div>
        <p className="text-zinc-400">Verificando autenticação...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black px-4">
      <div className="relative w-full max-w-md sm:max-w-sm md:max-w-md p-6 sm:p-8 bg-[#0c1423] rounded-xl shadow-lg space-y-6 text-center">
        
        {/* Logo */}
        <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 flex items-center justify-center shadow-lg">
          <Scissors className="h-7 w-7 text-black" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-serif font-bold text-white">Costa Urbana</h1>
        <p className="text-yellow-400/80">Painel Administrativo</p>

        {/* Tabs */}
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid grid-cols-2 mb-6 bg-[#1f2a3c] rounded-lg overflow-hidden">
            <TabsTrigger
              value="login"
              className="text-sm sm:text-base data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-400 data-[state=active]:to-yellow-500 data-[state=active]:text-black"
            >
              Login
            </TabsTrigger>
            <TabsTrigger
              value="register"
              className="text-sm sm:text-base data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-400 data-[state=active]:to-yellow-500 data-[state=active]:text-black"
            >
              Cadastro
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <LoginForm loading={loading} setLoading={setLoading} />
          </TabsContent>
          <TabsContent value="register">
            <RegisterForm loading={loading} setLoading={setLoading} />
          </TabsContent>
        </Tabs>

        {/* Back button */}
        <Button
          variant="outline"
          className="mt-4 text-sm flex items-center justify-center gap-2 border-[#334155] text-zinc-300 hover:bg-[#1f2a3c] hover:text-white mx-auto w-full sm:w-auto"
          onClick={() => navigate('/')}
        >
          <Home size={16} />
          Voltar ao site
        </Button>
      </div>
    </div>
  );
};

export default Auth;
