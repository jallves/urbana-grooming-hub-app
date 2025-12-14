import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Shield, Smartphone, FileText, Rocket, ScrollText } from "lucide-react";
import TEFDocumentacao from '@/components/admin/tef/TEFDocumentacao';
import TEFProducao from '@/components/admin/tef/TEFProducao';
import TotemStatus from '@/components/admin/tef/TotemStatus';
import UserManagement from '@/components/admin/settings/UserManagement';
import SessionsManagement from '@/pages/admin/SessionsManagement';
import { SecurityLogViewer } from '@/components/admin/security/SecurityLogViewer';

const AdminSettings: React.FC = () => {
  return (
    <AdminLayout 
      title="Configurações Master" 
      description="Painel exclusivo do administrador master"
      icon="⚙️"
    >
      <div className="w-full h-full p-4 md:p-6">
        <Tabs defaultValue="users" className="w-full">
          {/* Tabs com cores fixas pastéis */}
          <TabsList className="bg-gray-100 border border-gray-200 grid grid-cols-3 md:grid-cols-6 gap-1 p-1.5 h-auto">
            <TabsTrigger 
              value="users"
              className="py-2.5 px-3 text-xs md:text-sm font-medium rounded-lg bg-amber-100 text-amber-800 border border-amber-200 data-[state=active]:bg-amber-200 data-[state=active]:text-amber-900 data-[state=active]:border-amber-400 data-[state=active]:shadow-sm"
            >
              <Users className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Usuários</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger 
              value="sessions"
              className="py-2.5 px-3 text-xs md:text-sm font-medium rounded-lg bg-blue-100 text-blue-800 border border-blue-200 data-[state=active]:bg-blue-200 data-[state=active]:text-blue-900 data-[state=active]:border-blue-400 data-[state=active]:shadow-sm"
            >
              <Shield className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Sessões</span>
              <span className="sm:hidden">Sess.</span>
            </TabsTrigger>
            <TabsTrigger 
              value="totem"
              className="py-2.5 px-3 text-xs md:text-sm font-medium rounded-lg bg-green-100 text-green-800 border border-green-200 data-[state=active]:bg-green-200 data-[state=active]:text-green-900 data-[state=active]:border-green-400 data-[state=active]:shadow-sm"
            >
              <Smartphone className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Totem</span>
              <span className="sm:hidden">Totem</span>
            </TabsTrigger>
            <TabsTrigger 
              value="tef-docs"
              className="py-2.5 px-3 text-xs md:text-sm font-medium rounded-lg bg-purple-100 text-purple-800 border border-purple-200 data-[state=active]:bg-purple-200 data-[state=active]:text-purple-900 data-[state=active]:border-purple-400 data-[state=active]:shadow-sm"
            >
              <FileText className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">TEF Docs</span>
              <span className="sm:hidden">Docs</span>
            </TabsTrigger>
            <TabsTrigger 
              value="tef-prod"
              className="py-2.5 px-3 text-xs md:text-sm font-medium rounded-lg bg-rose-100 text-rose-800 border border-rose-200 data-[state=active]:bg-rose-200 data-[state=active]:text-rose-900 data-[state=active]:border-rose-400 data-[state=active]:shadow-sm"
            >
              <Rocket className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">TEF Produção</span>
              <span className="sm:hidden">Prod</span>
            </TabsTrigger>
            <TabsTrigger 
              value="security-log"
              className="py-2.5 px-3 text-xs md:text-sm font-medium rounded-lg bg-indigo-100 text-indigo-800 border border-indigo-200 data-[state=active]:bg-indigo-200 data-[state=active]:text-indigo-900 data-[state=active]:border-indigo-400 data-[state=active]:shadow-sm"
            >
              <ScrollText className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Log Segurança</span>
              <span className="sm:hidden">Logs</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="sessions" className="mt-6 h-[calc(100vh-250px)] overflow-auto">
            <SessionsManagement />
          </TabsContent>

          <TabsContent value="totem" className="mt-6">
            <TotemStatus />
          </TabsContent>

          <TabsContent value="tef-docs" className="mt-6 h-[calc(100vh-250px)] overflow-auto">
            <TEFDocumentacao />
          </TabsContent>

          <TabsContent value="tef-prod" className="mt-6 h-[calc(100vh-250px)] overflow-auto">
            <TEFProducao />
          </TabsContent>

          <TabsContent value="security-log" className="mt-6 h-[calc(100vh-250px)] overflow-auto">
            <SecurityLogViewer />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
