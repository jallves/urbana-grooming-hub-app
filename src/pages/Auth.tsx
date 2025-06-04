import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm, LoginFormProps } from '@/components/auth/LoginForm';
import { RegisterForm, RegisterFormProps } from '@/components/auth/RegisterForm';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Home, Scissors } from 'lucide-react';

// Adicionando as tipagens estendidas para incluir a prop theme
interface ExtendedLoginFormProps extends LoginFormProps {
  theme?: 'light' | 'dark';
}

interface ExtendedRegisterFormProps extends RegisterFormProps {
  theme?: 'light' | 'dark';
}

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [redirectTimer, setRedirectTimer] = useState(10);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, isAdmin, loading: authLoading } = useAuth();
  
  // Auto redirect timer
  useEffect(() => {
    if (!user && !authLoading && redirectTimer > 0) {
      const timer = setTimeout(() => {
        setRedirectTimer(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (!user && !authLoading && redirectTimer === 0) {
      navigate('/');
    }
  }, [redirectTimer, user, authLoading, navigate]);
  
  // Handle authenticated user redirect
  const from = location.state?.from || "/";
  
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

  // Create admin user if needed
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
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: 'joao.colimoides@gmail.com',
            password: 'Jb74872701@',
            options: { data: { full_name: 'João alves Da silva' } }
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
        console.error('Error checking/creating admin user:', error);
      }
    };
    
    createAdminUser();
  }, [authLoading, user, toast]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mb-4"></div>
        <p className="text-gray-400">Verificando autenticação...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 px-4 py-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header with barber theme */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Scissors className="h-10 w-10 text-amber-500" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Costa Urbana</h1>
          <p className="mt-2 text-amber-400/80">
            Painel administrativo
          </p>
        </div>
        
        {/* Auth card with glass effect */}
        <div className="bg-gray-800/70 backdrop-blur-sm shadow-xl rounded-lg p-6 border border-gray-700">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-700">
              <TabsTrigger 
                value="login"
                className="data-[state=active]:bg-amber-500 data-[state=active]:text-gray-900"
              >
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="register"
                className="data-[state=active]:bg-amber-500 data-[state=active]:text-gray-900"
              >
                Cadastro
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-0">
              <LoginForm 
                loading={loading} 
                setLoading={setLoading} 
                theme="dark" 
              />
            </TabsContent>
            
            <TabsContent value="register" className="mt-0">
              <RegisterForm 
                loading={loading} 
                setLoading={setLoading} 
                theme="dark" 
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Redirect notice */}
        {!user && redirectTimer > 0 && (
          <div className="text-center p-4 bg-amber-900/20 border border-amber-800/50 rounded-lg">
            <p className="text-amber-400 text-sm">
              Redirecionando em {redirectTimer} segundos
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="mt-2 border-amber-500 text-amber-400 hover:bg-amber-900/30 hover:text-amber-300"
            >
              Ir agora
            </Button>
          </div>
        )}

        {/* Back to site button */}
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            className="flex items-center gap-2 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
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