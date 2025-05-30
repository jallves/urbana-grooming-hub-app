
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import ClientAppointmentForm from '@/components/appointment/ClientAppointmentForm';
import { CalendarDays, ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoginForm from '@/components/auth/LoginForm';

export default function AppointmentBooking() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("login");
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    async function fetchClientId() {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        console.log('Fetching client for user:', user.email);
        
        // Search for existing client
        const { data, error } = await supabase
          .from('clients')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();

        if (error) {
          console.error('Error fetching client:', error);
          throw error;
        }

        if (data) {
          console.log('Client found:', data.id);
          setClientId(data.id);
        } else {
          console.log('No client found, creating new one');
          // Create new client if not found
          const { data: createdClient, error: clientError } = await supabase
            .from('clients')
            .insert([{
              name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Cliente',
              phone: user.user_metadata?.phone || '',
              email: user.email
            }])
            .select('id')
            .single();
          
          if (clientError) {
            console.error('Error creating client:', clientError);
            throw clientError;
          }
          
          console.log('Client created:', createdClient.id);
          setClientId(createdClient.id);
        }
      } catch (error: any) {
        console.error('Error in fetchClientId:', error);
        toast({
          title: "Erro ao buscar informações do cliente",
          description: error.message || "Não foi possível carregar suas informações. Por favor, tente novamente.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchClientId();
    }
  }, [user, authLoading, toast]);

  // Handle successful login
  const handleLoginSuccess = () => {
    console.log('Login successful, switching to appointment form');
    setActiveTab("appointment");
    // The useEffect above will handle fetching client data when user changes
  };

  if (authLoading || loading) {
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
            {user && clientId ? (
              <ClientAppointmentForm clientId={clientId} />
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Entrar</TabsTrigger>
                  <TabsTrigger value="register">Cadastrar</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <div className="text-center py-2 mb-4">
                    <p>Entre com seus dados para agendar</p>
                  </div>
                  <LoginForm 
                    loading={loginLoading} 
                    setLoading={setLoginLoading} 
                    onLoginSuccess={handleLoginSuccess} 
                  />
                </TabsContent>
                
                <TabsContent value="register">
                  <div className="text-center py-2 mb-4">
                    <p>Cadastre-se para agendar seu horário</p>
                  </div>
                  <Button 
                    className="w-full bg-urbana-gold hover:bg-urbana-gold/90" 
                    onClick={() => navigate('/register')}
                  >
                    Criar Cadastro
                  </Button>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
