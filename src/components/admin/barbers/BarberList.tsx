
import React from 'react';
import { Loader2, UserCog, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Barber } from '@/types/barber';

interface BarberListProps {
  barbers: Barber[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onDelete: (barberId: string) => void;
}

const BarberList: React.FC<BarberListProps> = ({
  barbers,
  isLoading,
  onEdit,
  onDelete,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Nome</th>
              <th className="px-4 py-2 text-left">E-mail</th>
              <th className="px-4 py-2 text-left">Cargo</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {barbers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-muted-foreground">
                  Nenhum barbeiro cadastrado
                </td>
              </tr>
            ) : (
              barbers.map((barber) => (
                <tr key={barber.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="px-4 py-2 font-semibold">{barber.name}</td>
                  <td className="px-4 py-2">{barber.email || '-'}</td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                      <UserCog className="h-4 w-4" /> Barbeiro
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {barber.is_active ? (
                      <span className="text-green-600">Ativo</span>
                    ) : (
                      <span className="text-red-500">Inativo</span>
                    )}
                  </td>
                  <td className="px-4 py-2 space-x-2">
                    <Button variant="outline" size="sm" onClick={() => onEdit(barber.id)}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(barber.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default BarberList;
