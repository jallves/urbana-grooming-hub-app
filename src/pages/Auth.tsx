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
  const [redirectTimer, setRedirectTimer] = useState(10);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, isAdmin, loading: authLoading } = useAuth();

  const from = location.state?.from || "/";

  useEffect(() => {
    if (!user && !authLoading && redirectTimer > 0) {
      const timer = setTimeout(() => {
        setRedirectTimer((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (!user && !authLoading && redirectTimer === 0) {
      navigate('/');
    }
  }, [redirectTimer, user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && user) {
      const redirectPath = from.startsWith('/admin') && isAdmin 
        ? from 
        : isAdmin 
          ? '/admin' 
          : '/';
      navigate(redirectPath, { replace: true });
    }
  }, [user, isAdmin, navigate, authLoading, from]);

  useEffect(() => {
    const createAdminUser = async () => {
      if (authLoading || user) return;

      try {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('email')
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
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
              <Scissors className="h-6 w-6 text-black" />
            </div>
          </div>
          <h1 className="text-3xl font-serif font-bold text-white">Costa Urbana</h1>
          <p className="text-sm text-yellow-400/80">Painel Administrativo</p>
        </div>

        {/* Tabs */}
        <div className="bg-[#0c1423] border border-[#1f2a3c] rounded-xl shadow-lg p-6">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid grid-cols-2 mb-5 bg-[#1f2a3c] rounded-lg overflow-hidden">
              <TabsTrigger 
                value="login"
                className="text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-400 data-[state=active]:to-yellow-500 data-[state=active]:text-black"
              >
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="register"
                className="text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-400 data-[state=active]:to-yellow-500 data-[state=active]:text-black"
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
        </div>

        {/* Aviso redirecionamento */}
        {!user && redirectTimer > 0 && (
          <div className="text-center bg-yellow-900/10 border border-yellow-700/30 text-yellow-300 rounded-md px-4 py-3 text-sm">
            Redirecionando em {redirectTimer} segundos...
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="mt-2 border-yellow-500 text-yellow-300 hover:bg-yellow-800/30"
            >
              Ir agora
            </Button>
          </div>
        )}

        {/* Botão voltar */}
        <div className="text-center">
          <Button
            variant="outline"
            className="text-sm flex items-center gap-2 border-[#334155] text-zinc-300 hover:bg-[#1f2a3c] hover:text-white"
            onClick={() => navigate('/')}
          >
            <Home size={16} />
            Voltar ao site
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
