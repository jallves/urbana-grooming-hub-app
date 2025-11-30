
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ShopSettingsForm from './ShopSettingsForm';
import UserManagement from './UserManagement';
import { Settings, Users } from "lucide-react";

const GeneralSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl p-6 shadow-lg border border-[#C5A15B]/20">
        <h1 className="text-2xl font-bold text-white">Configurações Gerais</h1>
        <p className="text-gray-300 mt-1">Gerencie as configurações da barbearia e permissões de usuários</p>
      </div>

      <Tabs defaultValue="shop" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-900 border border-[#C5A15B]/30 rounded-xl p-1.5 h-14 shadow-lg">
          <TabsTrigger 
            value="shop" 
            className="flex items-center justify-center gap-2.5 h-full rounded-lg font-medium transition-all duration-200
              bg-[#C5A15B]/10 text-[#C5A15B] border border-[#C5A15B]/20
              data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#C5A15B] data-[state=active]:to-[#D4B06A] 
              data-[state=active]:text-gray-900 data-[state=active]:shadow-md data-[state=active]:border-transparent"
          >
            <Settings className="h-5 w-5" />
            <span className="font-semibold">Barbearia</span>
          </TabsTrigger>
          <TabsTrigger 
            value="users" 
            className="flex items-center justify-center gap-2.5 h-full rounded-lg font-medium transition-all duration-200
              bg-[#C5A15B]/10 text-[#C5A15B] border border-[#C5A15B]/20
              data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#C5A15B] data-[state=active]:to-[#D4B06A] 
              data-[state=active]:text-gray-900 data-[state=active]:shadow-md data-[state=active]:border-transparent"
          >
            <Users className="h-5 w-5" />
            <span className="font-semibold">Usuários e Permissões</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="shop" className="mt-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Settings className="h-5 w-5 text-[#C5A15B]" />
                Configurações da Barbearia
              </h2>
            </div>
            <div className="p-6">
              <ShopSettingsForm />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="users" className="mt-6">
          <UserManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GeneralSettings;
