// src/pages/admin/barbers.tsx
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import BarberManagement from '@/components/admin/barbers/BarberManagement';
import UserRolesList from '@/components/admin/settings/users/UserRolesList';
import { UserCheck, ListFilter } from 'lucide-react';
import AdminRoute from '@/components/auth/AdminRoute';

export const BarberProvider = React.createContext([]);

const AdminBarbers: React.FC = () => {
  // Estado que será compartilhado com outros componentes
  const [barbers, setBarbers] = React.useState([]);

  return (
    <AdminRoute>
      <AdminLayout>
        <BarberProvider.Provider value={{ barbers, setBarbers }}>
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Gerenciamento de Barbeiros</h1>
            <p className="text-gray-500">Gerencie os barbeiros e suas permissões no sistema</p>

            <Tabs defaultValue="barbers" className="space-y-4">
              <TabsList>
                <TabsTrigger value="barbers" className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Barbeiros
                </TabsTrigger>
                <TabsTrigger value="roles" className="flex items-center gap-2">
                  <ListFilter className="h-4 w-4" />
                  Cargos e Permissões
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="barbers">
                <Card>
                  <CardContent className="pt-6">
                    <BarberManagement onBarbersUpdate={setBarbers} />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="roles">
                <Card>
                  <CardHeader>
                    <CardTitle>Cargos e Permissões</CardTitle>
                    <CardDescription>
                      Visualize os cargos atribuídos a cada usuário
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <UserRolesList />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </BarberProvider.Provider>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminBarbers;
