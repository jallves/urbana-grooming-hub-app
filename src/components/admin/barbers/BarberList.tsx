
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Edit, Trash2, User, Shield, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Barber {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  image_url: string | null;
  role: string | null;
  experience: string | null;
  commission_rate: number | null;
  specialties: string | null;
}

interface BarberListProps {
  barbers: Barber[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onDelete: () => void;
}

const BarberList: React.FC<BarberListProps> = ({ barbers, isLoading, onEdit, onDelete }) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteBarber, setDeleteBarber] = useState<Barber | null>(null);

  const handleDeleteClick = (barber: Barber) => {
    setDeleteBarber(barber);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteBarber) return;

    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', deleteBarber.id);

      if (error) {
        throw error;
      }

      toast.success('Barbeiro removido com sucesso');
      onDelete();
    } catch (error: any) {
      toast.error('Erro ao remover barbeiro', {
        description: error.message
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteBarber(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
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
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center py-8">
            <User className="h-12 w-12 text-zinc-400 mb-4" />
            <h3 className="text-xl font-medium mb-2">Nenhum barbeiro encontrado</h3>
            <p className="text-zinc-400 max-w-md mb-6">
              Não há profissionais categorizados como "Barbeiro" no sistema. 
              Vá ao módulo de profissionais para categorizar um profissional como barbeiro ou clique em "Novo Barbeiro" para criar um.
            </p>
            <Alert className="max-w-md">
              <ExternalLink className="h-4 w-4" />
              <AlertDescription>
                <strong>Dica:</strong> Profissionais categorizados como "Barbeiro" no módulo de profissionais aparecerão automaticamente aqui.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Barbeiros ({barbers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Foto</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead className="hidden md:table-cell">Telefone</TableHead>
                <TableHead className="hidden md:table-cell">Comissão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {barbers.map((barber) => (
                <TableRow key={barber.id}>
                  <TableCell>
                    <Avatar>
                      <AvatarImage src={barber.image_url || ''} alt={barber.name} />
                      <AvatarFallback>{getInitials(barber.name)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>
                      {barber.name}
                      <div className="text-xs text-muted-foreground">
                        <Badge variant="default" className="text-xs">Barbeiro</Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{barber.email || '-'}</TableCell>
                  <TableCell className="hidden md:table-cell">{barber.phone || '-'}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {barber.commission_rate ? `${barber.commission_rate}%` : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={barber.is_active ? "default" : "outline"}>
                      {barber.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onEdit(barber.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteClick(barber)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o barbeiro{' '}
              <strong>{deleteBarber?.name}</strong>? Esta ação não pode ser desfeita e removerá o profissional de ambos os módulos (Profissionais e Barbeiros).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BarberList;
