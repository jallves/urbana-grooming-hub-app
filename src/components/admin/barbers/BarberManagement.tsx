import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import BarberList from './BarberList';
import BarberForm from './BarberForm';
import AdminBarberBlockManager from './AdminBarberBlockManager';
import ConfirmActionDialog, { ConfirmActionType } from '../shared/ConfirmActionDialog';
import { Shield, Info, Users, Lock } from 'lucide-react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { deleteBarber } from '@/services/barberService';

const fetchBarbers = async () => {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .not('role', 'in', '(admin,manager,master)')
    .order('name');

  if (error) throw new Error(error.message);

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

interface ConfirmDialogState {
  open: boolean;
  type: ConfirmActionType;
  title: string;
  description: string;
  entityName: string;
  linkedDataMessage?: string;
  onConfirm: () => void;
}

const defaultDialog: ConfirmDialogState = {
  open: false, type: 'delete', title: '', description: '', entityName: '', onConfirm: () => {},
};

const BarberManagement: React.FC = () => {
  const [mode, setMode] = useState<'viewing' | 'editing'>('viewing');
  const [editingBarberId, setEditingBarberId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(defaultDialog);
  const queryClient = useQueryClient();

  const { data: barbers, isLoading, error, refetch } = useQuery({
    queryKey: ['barbers'],
    queryFn: fetchBarbers,
  });

  // Realtime para staff e painel_barbeiros
  useEffect(() => {
    const channel = supabase
      .channel('barbers-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff' }, () => {
        queryClient.invalidateQueries({ queryKey: ['barbers'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'painel_barbeiros' }, () => {
        queryClient.invalidateQueries({ queryKey: ['barbers'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  useEffect(() => {
    if (error) {
      toast.error('Erro ao carregar barbeiros', { description: (error as Error).message });
    }
  }, [error]);

  const closeDialog = useCallback(() => setConfirmDialog(defaultDialog), []);

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

  const handleDeleteBarber = useCallback(async (barberId: string) => {
    const barber = barbers?.find(b => b.id === barberId);
    if (!barber) return;

    // Check linked appointments in painel_barbeiros → painel_agendamentos
    const { data: painelBarber } = await supabase
      .from('painel_barbeiros')
      .select('id')
      .eq('email', barber.email)
      .maybeSingle();

    if (painelBarber) {
      const { count } = await supabase
        .from('painel_agendamentos')
        .select('id', { count: 'exact', head: true })
        .eq('barbeiro_id', painelBarber.id);

      if (count && count > 0) {
        // Has linked data — block delete, suggest deactivate
        setConfirmDialog({
          open: true,
          type: 'blocked',
          title: 'Exclusão Bloqueada',
          description: `Este barbeiro possui ${count} agendamento(s) vinculado(s) e não pode ser excluído permanentemente.`,
          entityName: barber.name,
          linkedDataMessage: 'Para remover este barbeiro das listagens ativas, inative-o pelo módulo de Funcionários.',
          onConfirm: closeDialog,
        });
        return;
      }
    }

    // No linked data — allow delete with confirmation
    setConfirmDialog({
      open: true,
      type: 'delete',
      title: 'Excluir Barbeiro',
      description: 'Esta ação é irreversível. Todos os dados deste barbeiro serão removidos permanentemente.',
      entityName: barber.name,
      onConfirm: async () => {
        try {
          await deleteBarber(barberId);
          toast.success('Barbeiro excluído com sucesso.');
          refetch();
          queryClient.invalidateQueries({ queryKey: ['barbers'] });
          queryClient.invalidateQueries({ queryKey: ['team-staff'] });
          queryClient.invalidateQueries({ queryKey: ['employees'] });
        } catch (err) {
          toast.error('Erro ao excluir barbeiro.', { description: (err as Error).message });
        }
        closeDialog();
      },
    });
  }, [barbers, closeDialog, refetch, queryClient]);

  const isFormVisible = mode === 'editing';

  return (
    <div className="w-full max-w-full space-y-4 p-2 sm:p-4 bg-gray-50 min-h-screen">
      <div className="flex flex-col space-y-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900 font-playfair">Barbeiros</h1>
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-raleway">
            Gerencie permissões e horários dos barbeiros
          </p>
        </div>
      </div>

      <Tabs defaultValue="permissions" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white border border-gray-200 rounded-lg p-1 h-auto gap-1">
          <TabsTrigger 
            value="permissions"
            className="bg-urbana-gold/20 text-urbana-gold data-[state=active]:bg-urbana-gold data-[state=active]:text-black text-xs sm:text-sm py-2 sm:py-2.5 rounded-md transition-all font-medium border border-urbana-gold/30"
          >
            <Shield className="h-4 w-4 mr-1.5" />
            Permissões
          </TabsTrigger>
          <TabsTrigger 
            value="blocks"
            className="bg-red-100 text-red-600 data-[state=active]:bg-red-600 data-[state=active]:text-white text-xs sm:text-sm py-2 sm:py-2.5 rounded-md transition-all font-medium border border-red-200"
          >
            <Lock className="h-4 w-4 mr-1.5" />
            Bloqueios de Horários
          </TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="mt-4 space-y-4" key={`perm-${mode}`}>
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

          <div className="w-full">
            <BarberList
              barbers={barbers || []}
              isLoading={isLoading}
              onEdit={handleEditBarber}
              onDelete={handleDeleteBarber}
            />
          </div>
        </TabsContent>

        <TabsContent value="blocks" className="mt-4" key="blocks-tab">
          <AdminBarberBlockManager />
        </TabsContent>
      </Tabs>

      {/* Dialog de confirmação temático */}
      <ConfirmActionDialog
        open={confirmDialog.open}
        onOpenChange={(open) => { if (!open) closeDialog(); }}
        onConfirm={confirmDialog.onConfirm}
        type={confirmDialog.type}
        title={confirmDialog.title}
        description={confirmDialog.description}
        entityName={confirmDialog.entityName}
        linkedDataMessage={confirmDialog.linkedDataMessage}
      />
    </div>
  );
};

export default BarberManagement;
