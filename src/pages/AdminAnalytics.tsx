
import React from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AdminAnalytics: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Relatórios e Analytics</h1>
          <p className="text-gray-500">Dashboard, KPIs e exportação de dados</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Dashboard e Analytics</CardTitle>
            <CardDescription>
              Este módulo está em desenvolvimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground">
                O módulo de Relatórios e Analytics está em desenvolvimento e estará disponível em breve.
                Aqui você terá acesso a dashboards completos, KPIs de desempenho e ferramentas para exportação de dados.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
