import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

const AdminSettings: React.FC = () => {
  return (
    <AdminLayout title="Configurações">
      <div className="w-full h-full p-6">
        <Tabs defaultValue="tef-homologacao" className="w-full">
          <TabsList className="bg-white border border-gray-200">
            <TabsTrigger 
              value="tef-homologacao"
              className="data-[state=active]:bg-black data-[state=active]:text-white"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              TEF Homologação
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tef-homologacao" className="mt-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-black">TEF Homologação</CardTitle>
                <CardDescription className="text-gray-600">
                  Configure as opções de homologação do TEF
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    Conteúdo em desenvolvimento
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
