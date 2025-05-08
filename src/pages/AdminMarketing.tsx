
import React from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AdminMarketing: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Marketing</h1>
          <p className="text-gray-500">Campanhas, cupons, indicações e métricas</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Gerenciamento de Marketing</CardTitle>
            <CardDescription>
              Este módulo está em desenvolvimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground">
                O módulo de Marketing está em desenvolvimento e estará disponível em breve.
                Aqui você poderá gerenciar campanhas, cupons de desconto, programa de indicações e análises de marketing.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminMarketing;
