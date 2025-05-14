
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import StaffForm from '../staff/StaffForm';
import BarberList from './BarberList';
import { toast } from 'sonner';

const BarberManagement: React.FC = () => {
  const [isAddingBarber, setIsAddingBarber] = useState(false);
  const [editingBarberId, setEditingBarberId] = useState<string | null>(null);
  
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
    toast.error('Erro ao carregar barbeiros', {
      description: (error as Error).message
    });
  }

  const handleAddBarber = () => {
    setEditingBarberId(null);
    setIsAddingBarber(true);
  };

  const handleEditBarber = (id: string) => {
    setIsAddingBarber(false);
    setEditingBarberId(id);
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

      {(isAddingBarber || editingBarberId) && (
        <Card>
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
