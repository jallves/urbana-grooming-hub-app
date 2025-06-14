
import React from 'react';
import { StaffMember } from '@/types/staff';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Phone, Mail, User } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BarberListProps {
  barbers: StaffMember[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onDelete: () => void;
}

const BarberList: React.FC<BarberListProps> = ({ barbers, isLoading, onEdit, onDelete }) => {
  const handleDelete = async (barberId: string, barberName: string) => {
    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', barberId);

      if (error) {
        throw error;
      }

      toast.success(`Barbeiro ${barberName} removido com sucesso`);
      onDelete();
    } catch (error) {
      console.error('Erro ao remover barbeiro:', error);
      toast.error('Erro ao remover barbeiro');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!barbers || barbers.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum barbeiro cadastrado</p>
            <p className="text-sm">Clique em "Novo Barbeiro" para adicionar o primeiro</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {barbers.map((barber) => (
        <Card key={barber.id} className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              {barber.image_url ? (
                <img
                  src={barber.image_url}
                  alt={barber.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-500" />
                </div>
              )}
              <div>
                <CardTitle className="text-lg">{barber.name}</CardTitle>
                <p className="text-sm text-muted-foreground capitalize">{barber.role}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 mb-4">
              {barber.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="truncate">{barber.email}</span>
                </div>
              )}
              {barber.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{barber.phone}</span>
                </div>
              )}
              {barber.specialties && (
                <div className="text-sm">
                  <span className="font-medium">Especialidades: </span>
                  <span className="text-muted-foreground">{barber.specialties}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <span className={`text-sm px-2 py-1 rounded-full ${
                  barber.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {barber.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(barber.id)}
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja remover o barbeiro "{barber.name}"? 
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(barber.id, barber.name)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Remover
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BarberList;
