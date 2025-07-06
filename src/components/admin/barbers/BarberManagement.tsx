
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

// Busca staff da tabela staff (não barbers)
const fetchBarbers = async () => {
  console.log('Buscando staff...');
  
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .order('name');

  if (error) {
    console.error('Erro ao buscar staff:', error);
    throw new Error(error.message);
  }

  console.log('Staff encontrados:', data);

  return (data ?? []).map((b: any) => ({
    id: String(b.id),
    uuid_id: b.id ?? '',
    name: b.name ?? '',
    email: b.email ?? '',
    phone: b.phone ?? '',
    image_url: b.image_url ?? '',
    specialties: b.specialties ?? '',
    experience: b.experience ?? '',
    commission_rate: b.commission_rate ?? 0,
    is_active: b.is_active ?? true,
    role: b.role ?? 'barber',
    created_at: b.created_at ?? '',
    updated_at: b.updated_at ?? '',
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
      console.error('Erro na query de barbeiros:', error);
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
        queryClient.invalidateQueries({ queryKey: ['team-staff'] });
      } catch (err) {
        console.error('Erro ao excluir barbeiro:', err);
        toast.error('Erro ao excluir barbeiro.', {
          description: (err as Error).message,
        });
      }
    }
  };

  const isFormVisible = mode === 'adding' || mode === 'editing';

  console.log('Estado atual:', { barbers, isLoading, error, mode });

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full">
      {/* Header Section - Responsivo */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="space-y-1">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
            Gerenciamento de Barbeiros
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Gerencie os barbeiros e suas permissões no sistema
          </p>
        </div>
        {mode === 'viewing' && (
          <Button 
            onClick={handleAddBarber}
            className="w-full sm:w-auto text-xs sm:text-sm px-3 py-2 sm:px-4"
          >
            <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Novo Barbeiro</span>
          </Button>
        )}
      </div>

      {/* Alerts e Cards informativos - Responsivos */}
      {mode === 'viewing' && (
        <>
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-3 w-3 sm:h-4 sm:w-4" />
            <AlertDescription className="text-xs sm:text-sm leading-relaxed text-blue-800">
              Este módulo exibe todos os profissionais cadastrados como "Barbeiro" na tabela staff.
            </AlertDescription>
          </Alert>
          
          <Card className="w-full bg-white border-gray-200">
            <CardHeader className="px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl text-gray-900">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-base md:text-lg">Controle de Acesso aos Módulos</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm leading-relaxed text-gray-600">
                Cada barbeiro pode ter permissões diferentes para acessar os módulos do sistema.
                Edite um barbeiro e acesse a aba "Permissões de Acesso" para configurar.
              </CardDescription>
            </CardHeader>
          </Card>
        </>
      )}

      {/* Formulário de Barbeiro - Responsivo */}
      {isFormVisible && (
        <Card className="w-full bg-white border-gray-200">
          <CardHeader className="px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
            <CardTitle className="text-base sm:text-lg md:text-xl text-gray-900">
              {mode === 'editing' ? 'Editar Barbeiro' : 'Novo Barbeiro'}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm leading-relaxed text-gray-600">
              {mode === 'editing'
                ? 'Edite as informações e permissões do barbeiro'
                : 'Preencha as informações para cadastrar um novo barbeiro no sistema. A categoria será automaticamente definida como "Barbeiro".'}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
            <div className="w-full overflow-x-auto">
              <BarberForm
                barberId={editingBarberId || undefined}
                onCancel={handleCancelForm}
                onSuccess={handleSuccess}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Barbeiros - Responsiva */}
      <div className="w-full overflow-x-auto">
        <BarberList
          barbers={barbers || []}
          isLoading={isLoading}
          onEdit={handleEditBarber}
          onDelete={handleDeleteBarber}
        />
      </div>
    </div>
  );
};

export default BarberManagement;
