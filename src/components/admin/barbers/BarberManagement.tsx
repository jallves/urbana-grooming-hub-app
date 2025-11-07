
import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import BarberList from './BarberList';
import BarberForm from './BarberForm';
import { Shield, Info, Users } from 'lucide-react';
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
  const [mode, setMode] = useState<'viewing' | 'editing'>('viewing');
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

  const isFormVisible = mode === 'editing';

  return (
    <div className="w-full max-w-full space-y-4 p-2 sm:p-4 bg-gray-50 min-h-screen">
      {/* Header responsivo */}
      <div className="flex flex-col space-y-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900 font-playfair">
            Barbeiros
          </h1>
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-raleway">
            Gerencie permissões de acesso dos barbeiros
          </p>
        </div>
      </div>

      {/* Alerts responsivos */}
      {mode === 'viewing' && (
        <div className="space-y-3">
          <Alert className="border-blue-300 bg-blue-50">
            <Users className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs sm:text-sm leading-relaxed text-blue-900">
              Os barbeiros são migrados automaticamente do módulo de Funcionários quando um funcionário tem o cargo de "Barbeiro".
            </AlertDescription>
          </Alert>
          
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-lg text-gray-900 font-playfair">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-urbana-gold" />
                Controle de Acesso ao Painel do Barbeiro
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm leading-relaxed text-gray-600">
                Clique em editar para configurar as permissões de acesso de cada barbeiro aos módulos do painel.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Formulário responsivo */}
      {isFormVisible && (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-sm sm:text-lg text-gray-900 font-playfair">
              Editar Permissões do Barbeiro
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm leading-relaxed text-gray-600">
              Configure as permissões de acesso aos módulos do painel do barbeiro
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <BarberForm
              barberId={editingBarberId || undefined}
              onCancel={handleCancelForm}
              onSuccess={handleSuccess}
            />
          </CardContent>
        </Card>
      )}

      {/* Lista responsiva */}
      <div className="w-full">
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
