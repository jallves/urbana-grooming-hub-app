
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UsersTab from './users/UsersTab';
import UserRolesList from './users/UserRolesList';
import { Users } from 'lucide-react';

const UserManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Gerenciamento de Usuários</CardTitle>
        <CardDescription>
          Gerencie usuários, cargos e permissões no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="roles">Cargos e Permissões</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UsersTab />
          </TabsContent>
          
          <TabsContent value="roles">
            <UserRolesList />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
