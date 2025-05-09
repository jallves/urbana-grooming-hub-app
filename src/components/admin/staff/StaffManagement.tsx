
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import StaffList from './StaffList';
import StaffForm from './StaffForm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useStaffStorage } from './useStaffStorage';

const StaffManagement: React.FC = () => {
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<string | null>(null);
  
  // Initialize staff photos storage bucket
  useStaffStorage();

  const { data: staffMembers, isLoading, error, refetch } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('name');
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    }
  });

  // Set up real-time subscription for staff
  useEffect(() => {
    const channel = supabase
      .channel('staff-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'staff'
        },
        (payload) => {
          console.log('Staff data changed:', payload);
          toast.info('Dados de profissionais atualizados');
          refetch(); // Refresh data when changes occur
        }
      )
      .subscribe();

    // Confirma que RLS foi desativado e mostra uma mensagem inicial
    toast.success('Sistema de profissionais inicializado', {
      description: 'Você pode criar, editar e visualizar profissionais livremente'
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  if (error) {
    toast.error('Erro ao carregar profissionais', {
      description: (error as Error).message
    });
  }

  const handleAddStaff = () => {
    setEditingStaff(null);
    setIsAddingStaff(true);
  };

  const handleEditStaff = (id: string) => {
    setIsAddingStaff(false);
    setEditingStaff(id);
  };

  const handleCancelForm = () => {
    setIsAddingStaff(false);
    setEditingStaff(null);
  };

  const handleSuccess = () => {
    refetch();
    setIsAddingStaff(false);
    setEditingStaff(null);
    
    // After successful staff update, also refresh the team display
    // by invalidating the team-staff query
    // This ensures the team component on homepage gets updated
    const queryClient = window.queryClient;
    if (queryClient) {
      queryClient.invalidateQueries({
        queryKey: ['team-staff']
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gerenciamento de Profissionais</h1>
        {!isAddingStaff && !editingStaff && (
          <Button onClick={handleAddStaff}>
            <Plus className="mr-2 h-4 w-4" /> Novo Profissional
          </Button>
        )}
      </div>

      {(isAddingStaff || editingStaff) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingStaff ? 'Editar Profissional' : 'Novo Profissional'}</CardTitle>
          </CardHeader>
          <CardContent>
            <StaffForm 
              staffId={editingStaff}
              onCancel={handleCancelForm}
              onSuccess={handleSuccess}
            />
          </CardContent>
        </Card>
      )}

      <StaffList 
        staffMembers={staffMembers || []}
        isLoading={isLoading}
        onEdit={handleEditStaff}
        onDelete={() => refetch()}
      />
    </div>
  );
};

export default StaffManagement;
