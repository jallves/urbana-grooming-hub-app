
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import AppointmentForm from '@/components/appointment/ClientAppointmentForm';
import { supabaseRPC } from '@/types/supabase-rpc';
import { CalendarDays, ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoginForm from '@/components/auth/LoginForm';

export default function AppointmentBooking() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("register");

  useEffect(() => {
    async function fetchClientId() {
      if (!user) {
        // Not redirecting if not authenticated since we now have login option
        setLoading(false);
        return;
      }
      
      try {
        // Buscar cliente pelo email do usuário autenticado
        const { data, error } = await supabase
          .from('clients')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (data) {
          setClientId(data.id);
        } else {
          // Se não encontrar cliente, criar um novo
          if (user.user_metadata?.full_name && user.email) {
            const { data: createdClient, error: clientError } = await supabaseRPC.createPublicClient(
              user.user_metadata.full_name,
              user.user_metadata.phone || '',
              user.email
            );
            
            if (clientError) {
              throw clientError;
            }
            
            setClientId(createdClient);
          }
        }
      } catch (error: any) {
        console.error('Error fetching client:', error);
        toast({
          title: "Erro ao buscar informações do cliente",
          description: error.message || "Não foi possível carregar suas informações. Por favor, tente novamente.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchClientId();
  }, [user, navigate, toast]);

  // When user logs in, switch to appointment form
  useEffect(() => {
    if (user) {
      setActiveTab("appointment");
    }
  }, [user]);

  const handleLoginSuccess = () => {
    setActiveTab("appointment");
    // No need to navigate since the useEffect will handle fetching the client ID
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-urbana-gold rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background pt-20 pb-10 px-4">
      <div className="container mx-auto max-w-4xl">
        <Button 
          variant="outline" 
          className="mb-6" 
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Home
        </Button>
        
        <Card className="shadow-lg">
          <CardHeader className="bg-urbana-black text-white text-center">
            <CalendarDays className="h-12 w-12 text-urbana-gold mx-auto mb-2" />
            <CardTitle className="text-2xl font-bold">Agendar Horário</CardTitle>
            <CardDescription className="text-gray-300">
              Escolha os serviços, profissional e horário disponíveis
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {clientId ? (
              <AppointmentForm clientId={clientId} />
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="register">Cadastrar</TabsTrigger>
                  <TabsTrigger value="login">Já tenho cadastro</TabsTrigger>
                </TabsList>
                
                <TabsContent value="register">
                  <div className="text-center py-2 mb-4">
                    <p>Cadastre-se para agendar seu horário</p>
                  </div>
                  <Button 
                    className="w-full bg-urbana-gold hover:bg-urbana-gold/90" 
                    onClick={() => navigate('/register-auth')}
                  >
                    Criar Cadastro
                  </Button>
                </TabsContent>
                
                <TabsContent value="login">
                  <div className="text-center py-2 mb-4">
                    <p>Entre com seus dados para agendar</p>
                  </div>
                  <LoginForm loading={false} setLoading={() => {}} onLoginSuccess={handleLoginSuccess} />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
