
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [initComplete, setInitComplete] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, isAdmin, loading: authLoading } = useAuth();
  
  // Obter o "from" do state ou usar fallback "/"
  const from = location.state?.from?.pathname || "/";
  
  // Verificar se o usuário já está autenticado
  useEffect(() => {
    console.log('Auth: Verificando autenticação', { user, authLoading, isAdmin });
    
    // Add a timeout to ensure we don't block the UI from rendering
    const redirectTimeout = setTimeout(() => {
      if (!authLoading && user) {
        console.log("Auth: Usuário autenticado, redirecionando");
        console.log("Auth: isAdmin:", isAdmin);
        console.log("Auth: from:", from);
        
        // Se a rota anterior for uma rota admin, verificar se o usuário é admin
        if (from.startsWith('/admin') && isAdmin) {
          console.log('Auth: Redirecionando de volta para:', from);
          navigate(from);
        } else if (isAdmin) {
          console.log('Auth: Redirecionando para o painel administrativo');
          navigate('/admin');
        } else {
          console.log('Auth: Redirecionando para a página principal');
          navigate('/');
        }
      } else if (!authLoading) {
        // Se não estiver autenticado e não estiver carregando, marcar como inicialização completa
        console.log('Auth: Inicialização completa, sem usuário autenticado');
        setInitComplete(true);
      }
    }, 500); // Short timeout to ensure we don't block rendering

    return () => clearTimeout(redirectTimeout);
  }, [user, isAdmin, navigate, authLoading, from]);

  // Criar o usuário específico se ele não existir
  useEffect(() => {
    const createSpecificUser = async () => {
      try {
        console.log("Verificando usuário específico...");
        // Verificar se o usuário já existe
        const { data: existingUsers, error: searchError } = await supabase
          .from('profiles')
          .select('email')
          .eq('email', 'joao.colimoides@gmail.com')
          .single();
        
        // Se não existir erro ou não houver usuário, crie um novo
        if (searchError || !existingUsers) {
          console.log("Criando usuário específico...");
          // Registrar o usuário
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: 'joao.colimoides@gmail.com',
            password: 'Jb74872701@',
            options: {
              data: {
                full_name: 'João alves Da silva',
              },
            }
          });

          if (signUpError) {
            console.error('Erro ao criar usuário específico:', signUpError);
            toast({
              title: "Erro ao criar usuário administrador",
              description: signUpError.message,
              variant: "destructive",
            });
            return;
          }
          
          if (signUpData.user) {
            console.log("Usuário criado, adicionando role de admin...");
            // Adicionar usuário à tabela de funções como administrador
            const { error: roleError } = await supabase
              .from('user_roles')
              .insert([
                { 
                  user_id: signUpData.user.id,
                  role: 'admin'
                }
              ]);
              
            if (roleError) {
              console.error('Erro ao adicionar role de admin:', roleError);
              toast({
                title: "Erro ao configurar permissões de admin",
                description: roleError.message,
                variant: "destructive",
              });
            } else {
              console.log('Usuário específico criado com sucesso e role adicionada');
              toast({
                title: "Usuário administrador criado",
                description: "Utilize o email joao.colimoides@gmail.com e a senha fornecida para login de admin",
              });
            }
          }
        } else {
          console.log("Usuário específico já existe");
        }
      } catch (error) {
        console.error('Erro ao verificar ou criar usuário específico:', error);
        toast({
          title: "Erro ao verificar usuário",
          description: "Ocorreu um erro ao verificar ou criar o usuário administrador",
          variant: "destructive",
        });
      }
    };
    
    if (initComplete && !authLoading && !user) {
      createSpecificUser();
    }
  }, [initComplete, authLoading, user, toast]);

  // Renderizar o loading state enquanto verifica autenticação
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Verificando autenticação...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary">Urbana Barbearia</h1>
          <p className="mt-2 text-muted-foreground">
            Acesso ao painel administrativo
          </p>
        </div>
        
        <div className="bg-card shadow-lg rounded-lg p-6 border">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Cadastro</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-0">
              <LoginForm loading={loading} setLoading={setLoading} />
            </TabsContent>
            
            <TabsContent value="register" className="mt-0">
              <RegisterForm loading={loading} setLoading={setLoading} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Auth;
