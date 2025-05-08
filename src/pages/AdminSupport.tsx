
import React from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AdminSupport: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Suporte e Ajuda</h1>
          <p className="text-gray-500">Central de atendimento e tutoriais</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Central de Suporte</CardTitle>
            <CardDescription>
              Este módulo está em desenvolvimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground">
                O módulo de Suporte e Ajuda está em desenvolvimento e estará disponível em breve.
                Aqui você terá acesso a tutoriais, chat interno e central de atendimento.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSupport;
