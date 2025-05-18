
import React from 'react';
import BarberLayout from '../components/barber/BarberLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserCog, Shield, Key } from 'lucide-react';
import BarberProfileForm from '@/components/barber/BarberProfileForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const BarberProfile: React.FC = () => {
  return (
    <BarberLayout title="Meu Perfil">
      <div className="space-y-6">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              Dados Pessoais
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Permissões
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Editar Perfil</CardTitle>
              </CardHeader>
              <CardContent>
                <BarberProfileForm />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Segurança da Conta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Alterar Senha</h3>
                  <p className="text-zinc-400 text-sm">
                    Para alterar sua senha, use o link de redefinição de senha enviado ao seu email.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Sessões Ativas</h3>
                  <p className="text-zinc-400 text-sm">
                    Você está atualmente conectado neste dispositivo.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="permissions">
            <Card>
              <CardHeader>
                <CardTitle>Suas Permissões</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-zinc-400">
                    Como barbeiro, você tem acesso aos seguintes módulos:
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center py-2 border-b border-zinc-800">
                      <div className="flex-1">
                        <p className="font-medium">Agendamentos</p>
                        <p className="text-sm text-zinc-400">Ver e gerenciar seus agendamentos</p>
                      </div>
                      <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Acesso Total
                      </div>
                    </div>
                    
                    <div className="flex items-center py-2 border-b border-zinc-800">
                      <div className="flex-1">
                        <p className="font-medium">Clientes</p>
                        <p className="text-sm text-zinc-400">Ver seus clientes e histórico</p>
                      </div>
                      <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Acesso Total
                      </div>
                    </div>
                    
                    <div className="flex items-center py-2 border-b border-zinc-800">
                      <div className="flex-1">
                        <p className="font-medium">Comissões</p>
                        <p className="text-sm text-zinc-400">Acompanhar suas comissões</p>
                      </div>
                      <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Acesso Total
                      </div>
                    </div>
                    
                    <div className="flex items-center py-2">
                      <div className="flex-1">
                        <p className="font-medium">Painel Administrativo</p>
                        <p className="text-sm text-zinc-400">Acesso limitado ao painel admin</p>
                      </div>
                      <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                        Acesso Parcial
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </BarberLayout>
  );
};

export default BarberProfile;
