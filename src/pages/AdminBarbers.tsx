import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import AdminRoute from '@/components/auth/AdminRoute';
import { Button } from '@/components/ui/button';
import { UserPlus, ListFilter, UserCheck } from 'lucide-react';
import LoadingSkeleton from '@/components/admin/LoadingSkeleton';

const BarberManagement = dynamic(
  () => import('@/components/admin/barbers/BarberManagement'),
  { 
    loading: () => <LoadingSkeleton />,
    ssr: false 
  }
);

const UserRolesList = dynamic(
  () => import('@/components/admin/settings/UserRolesList'),
  { 
    loading: () => <LoadingSkeleton />,
    ssr: false 
  }
);

const AdminBarbers: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'barbers' | 'roles'>('barbers');

  return (
    <AdminRoute allowedRoles={['admin']}>
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