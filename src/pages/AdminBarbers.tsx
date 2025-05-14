
import React from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import UserRolesList from '@/components/admin/settings/users/UserRolesList';
import { UserCheck, ListFilter } from 'lucide-react';
import BarberManagement from '@/components/admin/barbers/BarberManagement';

const AdminBarbers: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gerenciamento de Barbeiros</h1>
            <p className="text-gray-500">Gerencie os barbeiros e suas permissões no sistema</p>
          </div>
        </div>

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
                <BarberManagement />
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
    </AdminLayout>
  );
};

export default AdminBarbers;
