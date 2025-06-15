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

type Mode = 'viewing' | 'adding' | 'editing';

// Fetch barbers as Barber[] (id: number)
const fetchBarbers = async () => {
  const { data, error } = await supabase
    .from('staff_sequencial')
    .select('*')
    .eq('role', 'barber')
    .eq('is_active', true)
    .order('name');
  if (error) throw new Error(error.message);

  // Map only fields in Barber type
  return (
    Array.isArray(data)
      ? data.map((b) => ({
          id: Number(b.id),
          uuid_id: b.uuid_id ?? undefined,
          name: b.name ?? '',
          email: b.email ?? undefined,
          phone: b.phone ?? undefined,
          image_url: b.image_url ?? undefined,
          specialties: b.specialties ?? undefined,
          experience: b.experience ?? undefined,
          commission_rate: b.commission_rate ?? null,
          is_active: b.is_active ?? true,
          role: b.role ?? undefined,
          created_at: b.created_at ?? undefined,
          updated_at: b.updated_at ?? undefined,
        }))
      : []
  );
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
        await deleteBarber(barberId.toString());
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
              barberId={editingBarberId ?? undefined}
              onCancel={handleCancelForm}
              onSuccess={handleSuccess}
            />
          </CardContent>
        </Card>
      )}

      <BarberList
        barbers={(barbers || []).map(b => ({ ...b, id: b.id.toString() }))}
        isLoading={isLoading}
        onEdit={(id: string) => handleEditBarber(Number(id))}
        onDelete={(barberId: string) => handleDeleteBarber(Number(barberId))}
      />
    </div>
  );
};

export default BarberManagement;
