
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, isAdmin, isBarber, loading: authLoading } = useAuth();
  
  // Get redirect path
  const from = location.state?.from || "/";
  console.log('Auth: from path:', from);
  
  // Handle authenticated user redirect
  useEffect(() => {
    if (!authLoading && user) {
      console.log("Auth: User authenticated, redirecting", { isAdmin, isBarber, from });
      
      // Determine redirect destination
      let redirectPath = '/';
      
      if (from.startsWith('/admin') && isAdmin) {
        redirectPath = from;
      } else if (from.startsWith('/barber') && isBarber) {
        redirectPath = from;
      } else if (isAdmin) {
        redirectPath = '/admin';
      } else if (isBarber) {
        redirectPath = '/barber';
      }
      
      console.log('Auth: Redirecting to:', redirectPath);
      navigate(redirectPath, { replace: true });
    }
  }, [user, isAdmin, isBarber, navigate, authLoading, from]);

  // Create specific admin user if needed
  useEffect(() => {
    const createAdminUser = async () => {
      if (authLoading || user) return;
      
      try {
        console.log("Checking for admin user...");
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('email')
          .eq('email', 'joao.colimoides@gmail.com')
          .single();
        
        if (!existingUser) {
          console.log("Creating admin user...");
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
            console.error('Error creating admin user:', signUpError);
            return;
          }
          
          if (signUpData.user) {
            const { error: roleError } = await supabase
              .from('user_roles')
              .insert([
                { 
                  user_id: signUpData.user.id,
                  role: 'admin'
                }
              ]);
              
            if (roleError) {
              console.error('Error adding admin role:', roleError);
            } else {
              console.log('Admin user created successfully');
              toast({
                title: "Usuário administrador criado",
                description: "Use joao.colimoides@gmail.com para login de admin",
              });
            }
          }
        }
      } catch (error) {
        console.error('Error checking/creating admin user:', error);
      }
    };
    
    createAdminUser();
  }, [authLoading, user, toast]);

  // Show loading screen while checking authentication
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

        <div className="flex justify-center">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => navigate('/')}
          >
            <Home size={16} />
            Ver Site
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
