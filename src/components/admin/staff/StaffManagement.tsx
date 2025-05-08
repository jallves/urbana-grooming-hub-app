
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import StaffList from './StaffList';
import StaffForm from './StaffForm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const StaffManagement: React.FC = () => {
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<string | null>(null);

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
