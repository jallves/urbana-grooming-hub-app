import React from 'react';
import { MessageSquare } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

const AdminSupport: React.FC = () => {
  return (
    <AdminLayout 
      title="Gestão de Suporte" 
      description="Gerencie tickets de suporte dos clientes"
      icon="💬"
    >
      <div className="w-full max-w-none h-full px-4 sm:px-6 lg:px-8 py-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-gray-200">
          <MessageSquare className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Sistema de Suporte
          </h3>
          <p className="text-xs text-gray-500 text-center max-w-md">
            O sistema de tickets de suporte será disponibilizado em uma próxima atualização. 
            Por enquanto, utilize o WhatsApp ou e-mail para atender seus clientes.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSupport;
