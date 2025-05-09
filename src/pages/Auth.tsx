
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Verificar se o usuário já está autenticado
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate('/admin');
      }
    };
    
    checkSession();
    
    // Configurar listener para mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate('/admin');
      }
    });
    
    return () => subscription.unsubscribe();
  }, [navigate]);

  // Criar o usuário específico se ele não existir
  useEffect(() => {
    const createSpecificUser = async () => {
      try {
        // Verificar se o usuário já existe
        const { data: existingUsers, error: searchError } = await supabase
          .from('profiles')
          .select('email')
          .eq('email', 'joao.colimoides@gmail.com')
          .single();
        
        // Se não existir erro ou não houver usuário, crie um novo
        if (searchError || !existingUsers) {
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
            return;
          }
          
          if (signUpData.user) {
            // Adicionar usuário à tabela de funções como administrador
            await supabase
              .from('user_roles')
              .insert([
                { 
                  user_id: signUpData.user.id,
                  role: 'admin'
                }
              ]);
              
            console.log('Usuário específico criado com sucesso');
          }
        }
      } catch (error) {
        console.error('Erro ao verificar ou criar usuário específico:', error);
      }
    };
    
    createSpecificUser();
  }, []);

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
