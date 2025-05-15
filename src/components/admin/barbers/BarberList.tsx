
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Staff } from '@/types/staff';
import { Pencil, Trash2, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

interface BarberListProps {
  barbers: Staff[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onDelete: () => void;
  onManageAccess: (id: string, name: string) => void;
}

const BarberList: React.FC<BarberListProps> = ({ 
  barbers, 
  isLoading, 
  onEdit, 
  onDelete,
  onManageAccess
}) => {
  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este barbeiro?')) {
      try {
        const { error } = await supabase
          .from('staff')
          .delete()
          .eq('id', id);

        if (error) {
          throw error;
        }

        toast({
          title: "Barbeiro excluído",
          description: "O barbeiro foi removido com sucesso",
          variant: "default"
        });

        onDelete();
      } catch (error) {
        console.error('Erro ao excluir barbeiro:', error);
        toast({
          variant: "destructive",
          title: "Erro ao excluir",
          description: "Não foi possível excluir o barbeiro"
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
      </div>
    );
  }

  if (barbers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhum barbeiro cadastrado</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Telefone</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {barbers.map((barber) => (
          <TableRow key={barber.id}>
            <TableCell className="font-medium">{barber.name}</TableCell>
            <TableCell>{barber.email || '-'}</TableCell>
            <TableCell>{barber.phone || '-'}</TableCell>
            <TableCell>
              {barber.is_active ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                  Ativo
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                  Inativo
                </Badge>
              )}
            </TableCell>
            <TableCell className="text-right space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onManageAccess(barber.id, barber.name)}
              >
                <Shield className="h-4 w-4" />
                <span className="sr-only">Permissões</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEdit(barber.id)}
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Editar</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleDelete(barber.id)}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Excluir</span>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default BarberList;
