
import React, { useState } from 'react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Edit, MoreHorizontal, Trash2, Shield } from 'lucide-react';
import { StaffMember } from '@/types/staff';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface BarberListProps {
  barbers: StaffMember[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onDelete: () => void;
}

const BarberList: React.FC<BarberListProps> = ({ barbers, isLoading, onEdit, onDelete }) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [barberToDelete, setBarberToDelete] = useState<StaffMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!barberToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', barberToDelete.id);
      
      if (error) throw error;
      
      toast.success('Barbeiro removido com sucesso!');
      onDelete();
    } catch (error) {
      toast.error('Erro ao remover barbeiro', {
        description: (error as Error).message
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setBarberToDelete(null);
    }
  };

  const confirmDelete = (barber: StaffMember) => {
    setBarberToDelete(barber);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Carregando barbeiros...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (barbers.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-lg font-medium">Nenhum barbeiro cadastrado</p>
              <p className="text-sm text-muted-foreground mt-1">Clique em "Adicionar Barbeiro" para começar</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Barbeiro</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Taxa de Comissão</TableHead>
                <TableHead>Especialidades</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {barbers.map((barber) => (
                <TableRow key={barber.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        {barber.image_url ? (
                          <AvatarImage src={barber.image_url} alt={barber.name} />
                        ) : (
                          <AvatarFallback>{barber.name.charAt(0).toUpperCase()}</AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="font-medium">{barber.name}</p>
                        <p className="text-xs text-muted-foreground">{barber.experience || 'Sem experiência informada'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {barber.email && <div className="text-sm">{barber.email}</div>}
                    {barber.phone && <div className="text-sm">{barber.phone}</div>}
                    {!barber.email && !barber.phone && '-'}
                  </TableCell>
                  <TableCell>
                    {barber.commission_rate !== null ? `${barber.commission_rate}%` : 'Não definida'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {barber.specialties ? (
                        barber.specialties.split(',').map((specialty, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {specialty.trim()}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">Não informadas</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {barber.is_active ? (
                      <Badge variant="default" className="bg-green-500">Ativo</Badge>
                    ) : (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(barber.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2" onClick={() => {}}>
                          <Shield className="h-4 w-4" />
                          Configurar Acesso
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => confirmDelete(barber)} className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o barbeiro "{barberToDelete?.name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BarberList;
