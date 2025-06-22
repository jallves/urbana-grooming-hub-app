
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

// Busca barbeiros da tabela barbers com JOIN na tabela staff
const fetchBarbers = async () => {
  const { data, error } = await supabase
    .from('barbers')
    .select(`
      id,
      staff_id,
      user_id,
      created_at,
      updated_at,
      staff:staff_id (
        id,
        name,
        email,
        phone,
        image_url,
        specialties,
        experience,
        commission_rate,
        is_active,
        role
      )
    `)
    .eq('staff.is_active', true)
    .eq('staff.role', 'barber')
    .order('staff(name)');

  if (error) throw new Error(error.message);

  // Transformar dados para manter compatibilidade com componentes existentes
  return (data ?? [])
    .filter((b: any) => b.staff && b.staff.id && b.staff.name)
    .map((b: any) => ({
      id: String(b.id),
      uuid_id: b.staff_id ?? '',
      name: b.staff.name ?? '',
      email: b.staff.email ?? '',
      phone: b.staff.phone ?? '',
      image_url: b.staff.image_url ?? '',
      specialties: b.staff.specialties ?? '',
      experience: b.staff.experience ?? '',
      commission_rate: b.staff.commission_rate ?? 0,
      is_active: b.staff.is_active ?? true,
      role: b.staff.role ?? 'barber',
      created_at: b.created_at ?? '',
      updated_at: b.updated_at ?? '',
      staff_id: b.staff_id,
      barber_id: b.id
    }));
};

const BarberManagement: React.FC = () => {
  const [mode, setMode] = useState<'viewing' | 'adding' | 'editing'>('viewing');
  const [editingBarberId, setEditingBarberId] = useState<string | null>(null);
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

  const handleEditBarber = (id: string) => {
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
    queryClient.invalidateQueries({ queryKey: ['staff'] });
    queryClient.invalidateQueries({ queryKey: ['team-staff'] });
  };

  const handleDeleteBarber = async (barberId: string) => {
    if (
      window.confirm('Tem certeza que deseja excluir este barbeiro? Esta ação não pode ser desfeita.')
    ) {
      try {
        await deleteBarber(barberId);
        toast.success('Barbeiro excluído com sucesso.');
        refetch();
        queryClient.invalidateQueries({ queryKey: ['barbers'] });
        queryClient.invalidateQueries({ queryKey: ['staff'] });
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
              Este módulo exibe automaticamente todos os profissionais categorizados como "Barbeiro" na tabela staff, 
              agora vinculados através da tabela barbers para melhor organização.
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
              barberId={editingBarberId || undefined}
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
