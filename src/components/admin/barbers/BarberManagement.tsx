
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Shield } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import StaffForm from '../staff/StaffForm';
import BarberList from './BarberList';
import { BarberModuleAccess } from './BarberModuleAccess';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const BarberManagement: React.FC = () => {
  const [isAddingBarber, setIsAddingBarber] = useState(false);
  const [editingBarberId, setEditingBarberId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('barbers');
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
  const [selectedBarberName, setSelectedBarberName] = useState<string>('');
  
  const { data: barbers, isLoading, error, refetch } = useQuery({
    queryKey: ['barbers'],
    queryFn: async () => {
      // Busca apenas staff com role contendo "barber" ou "barbeiro"
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .or('role.ilike.%barber%,role.ilike.%barbeiro%')
        .order('name');
      
      if (error) {
        console.error('Erro ao carregar barbeiros:', error);
        throw new Error(error.message);
      }
      
      return data || [];
    }
  });

  if (error) {
    toast({
      variant: "destructive",
      title: "Erro ao carregar barbeiros",
      description: (error as Error).message
    });
  }

  const handleAddBarber = () => {
    setEditingBarberId(null);
    setIsAddingBarber(true);
    setActiveTab('barbers');
  };

  const handleEditBarber = (id: string) => {
    setIsAddingBarber(false);
    setEditingBarberId(id);
    setActiveTab('barbers');
  };

  const handleManageAccess = (id: string, name: string) => {
    setSelectedBarber(id);
    setSelectedBarberName(name);
    setActiveTab('access');
  };

  const handleCancelForm = () => {
    setIsAddingBarber(false);
    setEditingBarberId(null);
  };

  const handleSuccess = () => {
    refetch();
    setIsAddingBarber(false);
    setEditingBarberId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Gerenciamento de Barbeiros</h2>
        {!isAddingBarber && !editingBarberId && (
          <Button onClick={handleAddBarber}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar Barbeiro
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="barbers" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Barbeiros
          </TabsTrigger>
          {selectedBarber && (
            <TabsTrigger value="access" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Permissões de Acesso
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="barbers">
          {(isAddingBarber || editingBarberId) && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{editingBarberId ? 'Editar Barbeiro' : 'Novo Barbeiro'}</CardTitle>
              </CardHeader>
              <CardContent>
                <StaffForm 
                  staffId={editingBarberId}
                  onCancel={handleCancelForm}
                  onSuccess={handleSuccess}
                  defaultRole="Barbeiro"
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <BarberList 
                barbers={barbers || []}
                isLoading={isLoading}
                onEdit={handleEditBarber}
                onDelete={() => refetch()}
                onManageAccess={handleManageAccess}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {selectedBarber && (
          <TabsContent value="access">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Configurar Permissões: {selectedBarberName}
                </CardTitle>
                <CardDescription>
                  Defina quais recursos este barbeiro poderá acessar no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BarberModuleAccess 
                  barberId={selectedBarber}
                  onSuccess={() => {
                    toast({
                      title: "Permissões atualizadas",
                      description: `As permissões de ${selectedBarberName} foram atualizadas com sucesso`,
                      variant: "default"
                    });
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default BarberManagement;
