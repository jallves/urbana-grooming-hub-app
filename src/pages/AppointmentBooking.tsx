import React, { useEffect, useState, useCallback } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("login");
  const [loginLoading, setLoginLoading] = useState(false);

  const fetchClientId = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Search for existing client
      const { data, error } = await supabase
        .from('clients')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setClientId(data.id);
      } else {
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
        
        if (clientError) throw clientError;
        setClientId(createdClient.id);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao buscar informações do cliente",
        description: error.message || "Não foi possível carregar suas informações. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.email, user?.user_metadata, toast]);

  useEffect(() => {
    if (!authLoading && user && user.email) {
      fetchClientId();
    }
  }, [authLoading, user?.email]);

  const handleLoginSuccess = useCallback(() => {
    setActiveTab("appointment");
  }, []);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse space-y-4">
          <div className="h-12 w-12 bg-urbana-gold/20 rounded-full mx-auto"></div>
          <div className="h-4 w-32 bg-urbana-gold/10 rounded mx-auto"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-urbana-black/5 pt-16 pb-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <Button 
          variant="ghost" 
          className="mb-8 -ml-2 group hover:bg-urbana-gold/10 transition-colors"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4 text-urbana-gold group-hover:translate-x-[-2px] transition-transform" />
          <span className="text-urbana-gold">Voltar para Home</span>
        </Button>
        
        <Card className="shadow-2xl border-urbana-gold/20 overflow-hidden">
          <CardHeader className="bg-urbana-black text-white relative pb-12">
            <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-urbana-gold/10"></div>
            <div className="relative z-10 text-center">
              <CalendarDays className="h-12 w-12 text-urbana-gold mx-auto mb-3" />
              <CardTitle className="text-3xl font-bold tracking-tight">Agendar Horário</CardTitle>
              <CardDescription className="text-gray-300/90 mt-2">
                Escolha os serviços, profissional e horário disponíveis
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="pt-8 px-6 pb-6">
            {user && clientId ? (
              <ClientAppointmentForm clientId={clientId} />
            ) : (
              <div className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-urbana-black/5 p-1 rounded-lg">
                    <TabsTrigger 
                      value="login" 
                      className="data-[state=active]:bg-urbana-gold data-[state=active]:text-white rounded-md transition-colors"
                    >
                      Entrar
                    </TabsTrigger>
                    <TabsTrigger 
                      value="register" 
                      className="data-[state=active]:bg-urbana-gold data-[state=active]:text-white rounded-md transition-colors"
                    >
                      Cadastrar
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login" className="pt-4">
                    <LoginForm 
                      loading={loginLoading} 
                      setLoading={setLoginLoading} 
                      onLoginSuccess={handleLoginSuccess} 
                    />
                  </TabsContent>
                  
                  <TabsContent value="register" className="pt-4">
                    <div className="space-y-4">
                      <p className="text-center text-sm text-muted-foreground">
                        Cadastre-se para agendar seu horário
                      </p>
                      <Button 
                        className="w-full bg-urbana-gold hover:bg-urbana-gold/90 h-11 rounded-lg shadow-sm transition-all hover:shadow-urbana-gold/20"
                        onClick={() => navigate('/register')}
                      >
                        Criar Cadastro
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-urbana-gold/10"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Agilize seu atendimento
                    </span>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full border-urbana-gold/30 text-urbana-gold hover:bg-urbana-gold/5 hover:border-urbana-gold/50"
                  onClick={() => navigate('/contact')}
                >
                  Precisa de ajuda?
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
