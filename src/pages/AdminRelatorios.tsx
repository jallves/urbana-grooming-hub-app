import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import RelatoriosGerenciais from '@/components/admin/relatorios/RelatoriosGerenciais';

const AdminRelatorios: React.FC = () => {
  return (
    <AdminLayout 
      title="Relatórios Gerenciais" 
      description="Análise completa de performance, vendas e operações"
      icon="📊"
    >
      <div className="w-full h-full flex flex-col bg-gray-50">
        <div className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">
          <RelatoriosGerenciais />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminRelatorios;
