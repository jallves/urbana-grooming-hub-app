import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Settings } from "lucide-react";

const AdminSettings: React.FC = () => {
  return (
    <AdminLayout title="Configurações">
      <div className="w-full h-full flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-6 rounded-full bg-gradient-to-br from-urbana-gold/20 to-yellow-500/20">
              <Settings className="h-16 w-16 text-urbana-gold" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Configurações</h2>
          <p className="text-gray-500 max-w-md">
            Este módulo está em desenvolvimento e será disponibilizado em breve.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
