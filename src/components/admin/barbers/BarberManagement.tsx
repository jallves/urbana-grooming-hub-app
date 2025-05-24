
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import BarberList from './BarberList';
import BarberForm from './BarberForm';
import { Button } from '@/components/ui/button';
import { Plus, Shield, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useStaffStorage } from '../staff/useStaffStorage';

const BarberManagement: React.FC = () => {
  const [isAddingBarber, setIsAddingBarber] = useState(false);
  const [editingBarber, setEditingBarber] = useState<string | null>(null);
  
  // Initialize staff photos storage bucket (shared with staff management)
  useStaffStorage();

  const { data: barbers, isLoading, error, refetch } = useQuery({
    queryKey: ['barbers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('role', 'barber')
        .order('name');
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    }
  });

  if (error) {
    toast.error('Erro ao carregar barbeiros', {
      description: (error as Error).message
    });
  }

  const handleAddBarber = () => {
    setEditingBarber(null);
    setIsAddingBarber(true);
  };

  const handleEditBarber = (id: string) => {
    setIsAddingBarber(false);
    setEditingBarber(id);
  };

  const handleCancelForm = () => {
    setIsAddingBarber(false);
    setEditingBarber(null);
  };

  const handleSuccess = () => {
    refetch();
    setIsAddingBarber(false);
    setEditingBarber(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gerenciamento de Barbeiros</h1>
        {!isAddingBarber && !editingBarber && (
          <Button onClick={handleAddBarber}>
            <Plus className="mr-2 h-4 w-4" /> Novo Barbeiro
          </Button>
        )}
      </div>

      {!isAddingBarber && !editingBarber && (
        <>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Este módulo exibe automaticamente todos os profissionais categorizados como "Barbeiro" no módulo de profissionais. 
              Para adicionar um novo barbeiro, você pode usar o botão "Novo Barbeiro" aqui ou ir ao módulo de profissionais e criar um profissional com categoria "Barbeiro".
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Controle de Acesso aos Módulos
              </CardTitle>
              <CardDescription>
                Cada barbeiro pode ter permissões diferentes para acessar os módulos do sistema.
                Edite um barbeiro e acesse a aba "Permissões de Acesso" para configurar.
              </CardDescription>
            </CardHeader>
          </Card>
        </>
      )}

      {(isAddingBarber || editingBarber) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingBarber ? 'Editar Barbeiro' : 'Novo Barbeiro'}</CardTitle>
            <CardDescription>
              {editingBarber 
                ? 'Edite as informações e permissões do barbeiro' 
                : 'Preencha as informações para cadastrar um novo barbeiro no sistema. A categoria será automaticamente definida como "Barbeiro".'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BarberForm 
              barberId={editingBarber}
              onCancel={handleCancelForm}
              onSuccess={handleSuccess}
            />
          </CardContent>
        </Card>
      )}

      <BarberList 
        barbers={barbers || []}
        isLoading={isLoading}
        onEdit={handleEditBarber}
        onDelete={() => refetch()}
      />
    </div>
  );
};

export default BarberManagement;
