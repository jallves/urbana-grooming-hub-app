import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, User, Phone, Lock, Eye, EyeOff, Scissors } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoginForm from '@/components/auth/LoginForm';

// Esquema de validação
const formSchema = z.object({
  fullName: z.string().min(3, {
    message: "Nome deve ter pelo menos 3 caracteres.",
  }),
  email: z.string().email({
    message: "Por favor, informe um e-mail válido.",
  }),
  phone: z.string().min(10, {
    message: "Telefone deve ter pelo menos 10 dígitos.",
  }),
  password: z.string().min(6, {
    message: "Senha deve ter pelo menos 6 caracteres.",
  }),
});

export default function RegisterAuth() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("register");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    
    try {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert([{ name: values.fullName, email: values.email, phone: values.phone }])
        .select()
        .single();

      if (clientError) throw new Error('Erro ao criar registro de cliente');

      const { error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: { data: { full_name: values.fullName, phone: values.phone, client_id: clientData.id } }
      });

      if (authError) {
        await supabase.from('clients').delete().eq('id', clientData.id);
        throw authError;
      }

      toast({
        title: "Conta criada com sucesso!",
        description: "Você pode agora fazer login e agendar seus horários.",
      });

      setActiveTab("login");
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Ocorreu um erro ao criar sua conta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleLoginSuccess = () => navigate('/agendar');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-gray-700 bg-gray-800/50 backdrop-blur-sm overflow-hidden">
        {/* Barra superior temática */}
        <div className="h-2 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 w-full"></div>
        
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Scissors className="h-8 w-8 text-amber-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Costa Urbana</CardTitle>
          <CardDescription className="text-gray-400">
            {activeTab === "register" 
              ? "Crie sua conta para agendar" 
              : "Acesse sua conta para agendar"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-700">
              <TabsTrigger 
                value="register" 
                className="data-[state=active]:bg-amber-500 data-[state=active]:text-gray-900"
              >
                Cadastrar
              </TabsTrigger>
              <TabsTrigger 
                value="login" 
                className="data-[state=active]:bg-amber-500 data-[state=active]:text-gray-900"
              >
                Entrar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="register">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {[
                    { name: "fullName", label: "Nome Completo", icon: User, placeholder: "João da Silva" },
                    { name: "email", label: "E-mail", icon: Mail, placeholder: "seu@email.com" },
                    { name: "phone", label: "Telefone", icon: Phone, placeholder: "(00) 00000-0000" },
                  ].map((field) => (
                    <FormField
                      key={field.name}
                      control={form.control}
                      name={field.name as keyof z.infer<typeof formSchema>}
                      render={({ field: renderField }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">{field.label}</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input 
                                placeholder={field.placeholder}
                                {...renderField} 
                                className="pl-10 bg-gray-700 border-gray-600 text-white focus-visible:ring-amber-500"
                              />
                            </FormControl>
                            <field.icon className="absolute left-3 top-2.5 h-5 w-5 text-amber-400" />
                          </div>
                          <FormMessage className="text-amber-400" />
                        </FormItem>
                      )}
                    />
                  ))}

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Senha</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input 
                              type={showPassword ? "text" : "password"}
                              placeholder="******"
                              {...field}
                              className="pl-10 bg-gray-700 border-gray-600 text-white focus-visible:ring-amber-500"
                            />
                          </FormControl>
                          <Lock className="absolute left-3 top-2.5 h-5 w-5 text-amber-400" />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1 hover:bg-gray-600"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? 
                              <EyeOff className="h-5 w-5 text-amber-400" /> : 
                              <Eye className="h-5 w-5 text-amber-400" />}
                          </Button>
                        </div>
                        <FormMessage className="text-amber-400" />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold"
                    disabled={loading}
                  >
                    {loading ? "Criando conta..." : "Criar Conta"}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="login">
              <div className="text-center py-2 mb-4 text-gray-400">
                <p>Entre com seus dados para agendar</p>
              </div>
              <LoginForm 
                loading={loading} 
                setLoading={setLoading} 
                onLoginSuccess={handleLoginSuccess}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <div className="px-6 pb-4 text-center">
          <Button 
            variant="link" 
            onClick={() => navigate('/')}
            className="text-amber-400 hover:text-amber-300"
          >
            ← Voltar para Home
          </Button>
        </div>
      </Card>
    </div>
  );
}
