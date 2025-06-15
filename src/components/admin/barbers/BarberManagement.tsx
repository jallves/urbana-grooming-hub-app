import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import BarberList from './BarberList';
import BarberForm from './BarberForm';
import { Button } from '@/components/ui/button';
import { Plus, Shield, Info } from 'lucide-react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { deleteBarber } from '@/services/barberService';

// ---- MODE ENUM ----
type Mode = 'viewing' | 'adding' | 'editing';

// Buscar barbeiros com o cargo barber no staff_sequencial
const fetchBarbers = async () => {
  // Barbers from staff_sequencial use id: number, so type accordingly
  const { data, error } = await supabase
    .from('staff_sequencial')
    .select('*')
    .eq('role', 'barber')
    .eq('is_active', true)
    .order('name');
  if (error) throw new Error(error.message);
  return data;
};

const BarberManagement: React.FC = () => {
  const [mode, setMode] = useState<Mode>('viewing');
  const [editingBarberId, setEditingBarberId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const {
    data: barbers,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['barbers'],
    queryFn: fetchBarbers,
  });

  useEffect(() => {
    if (error) {
      toast.error('Erro ao carregar barbeiros', {
        description: (error as Error).message,
      });
    }
  }, [error]);

  const handleAddBarber = () => {
    setEditingBarberId(null);
    setMode('adding');
  };

  const handleEditBarber = (id: number) => {
    setEditingBarberId(id);
    setMode('editing');
  };

  const handleCancelForm = () => {
    setMode('viewing');
    setEditingBarberId(null);
  };

  const handleSuccess = () => {
    setMode('viewing');
    setEditingBarberId(null);
    refetch();
    queryClient.invalidateQueries({ queryKey: ['barbers'] });
    queryClient.invalidateQueries({ queryKey: ['staff_sequencial'] });
    queryClient.invalidateQueries({ queryKey: ['team-staff'] });
  };

  const handleDeleteBarber = async (barberId: number) => {
    if (
      window.confirm('Tem certeza que deseja excluir este barbeiro? Esta ação não pode ser desfeita.')
    ) {
      try {
        await deleteBarber(barberId);
        toast.success('Barbeiro excluído com sucesso.');
        refetch();
        queryClient.invalidateQueries({ queryKey: ['barbers'] });
        queryClient.invalidateQueries({ queryKey: ['staff_sequencial'] });
        queryClient.invalidateQueries({ queryKey: ['team-staff'] });
      } catch (err) {
        toast.error('Erro ao excluir barbeiro.', {
          description: (err as Error).message,
        });
      }
    }
  };

  const isFormVisible = mode === 'adding' || mode === 'editing';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gerenciamento de Barbeiros</h1>
          <p className="text-muted-foreground">
            Gerencie os barbeiros e suas permissões no sistema
          </p>
        </div>

        {mode === 'viewing' && (
          <Button onClick={handleAddBarber}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Barbeiro
          </Button>
        )}
      </div>

      {mode === 'viewing' && (
        <>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Este módulo exibe automaticamente todos os profissionais categorizados como "Barbeiro" em staff_sequencial.
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

      {isFormVisible && (
        <Card>
          <CardHeader>
            <CardTitle>{mode === 'editing' ? 'Editar Barbeiro' : 'Novo Barbeiro'}</CardTitle>
            <CardDescription>
              {mode === 'editing'
                ? 'Edite as informações e permissões do barbeiro'
                : 'Preencha as informações para cadastrar um novo barbeiro no sistema. A categoria será automaticamente definida como "Barbeiro".'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BarberForm
              // Here, pass barberId as number or undefined/null when creating
              barberId={editingBarberId !== null ? editingBarberId : undefined}
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
        onDelete={handleDeleteBarber}
      />
    </div>
  );
};

export default BarberManagement;
