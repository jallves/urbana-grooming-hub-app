
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

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, isAdmin, loading: authLoading } = useAuth();

  const from = location.state?.from || "/admin";

  // Só redireciona se o usuário está tentando acessar uma rota protegida
  useEffect(() => {
    if (!authLoading && user && isAdmin && location.state?.from) {
      navigate(from, { replace: true });
    }
  }, [user, isAdmin, navigate, authLoading, from, location.state]);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          {/* Logo */}
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-2xl">
            <Scissors className="h-10 w-10 text-black" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              Costa Urbana
            </h1>
            <p className="text-slate-400 text-lg">
              Painel Administrativo
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="space-y-6">
            {/* Form Header */}
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-amber-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Acesso Administrativo</h2>
              <p className="text-slate-400 text-sm">
                Entre com suas credenciais para acessar o painel
              </p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid grid-cols-2 w-full bg-slate-800/50 rounded-xl p-1">
                <TabsTrigger
                  value="login"
                  className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-amber-500 data-[state=active]:text-black data-[state=active]:shadow-lg transition-all duration-200"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-amber-500 data-[state=active]:text-black data-[state=active]:shadow-lg transition-all duration-200"
                >
                  <User className="h-4 w-4 mr-2" />
                  Cadastro
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-6">
                <LoginForm loading={loading} setLoading={setLoading} />
              </TabsContent>
              <TabsContent value="register" className="mt-6">
                <RegisterForm loading={loading} setLoading={setLoading} />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Back button */}
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl px-6 py-3 transition-all duration-200"
          >
            <Home className="h-4 w-4 mr-2" />
            Voltar ao site
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
