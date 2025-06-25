
import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import AdminRoute from '@/components/auth/AdminRoute';
import { Button } from '@/components/ui/button';
import { UserPlus, ListFilter, UserCheck } from 'lucide-react';
import LoadingSkeleton from '@/components/admin/LoadingSkeleton';

// Componentes temporários até criarmos os reais
const BarberManagement: React.FC = () => {
  return (
    <div className="p-8 text-center">
      <h3 className="text-lg font-semibold mb-2">Gerenciamento de Barbeiros</h3>
      <p className="text-muted-foreground">Aqui você pode gerenciar os barbeiros da barbearia</p>
    </div>
  );
};

const UserRolesList: React.FC = () => {
  return (
    <div className="p-4">
      <h4 className="text-md font-semibold mb-2">Lista de Permissões</h4>
      <p className="text-muted-foreground">Gerencie os cargos e permissões dos usuários</p>
    </div>
  );
};

const AdminBarbers: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'barbers' | 'roles'>('barbers');

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Equipe</h1>
              <p className="text-muted-foreground">
                Gerencie barbeiros e permissões do sistema
              </p>
            </div>
            {activeTab === 'barbers' && (
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Barbeiro
              </Button>
            )}
          </header>

          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as 'barbers' | 'roles')}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="barbers">
                <UserCheck className="h-4 w-4 mr-2" />
                Barbeiros
              </TabsTrigger>
              <TabsTrigger value="roles">
                <ListFilter className="h-4 w-4 mr-2" />
                Permissões
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="barbers" className="mt-6">
              <BarberManagement />
            </TabsContent>
            
            <TabsContent value="roles" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Controle de Acessos</CardTitle>
                  <CardDescription>
                    Gerencie cargos e permissões dos usuários
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UserRolesList />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminBarbers;
