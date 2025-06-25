
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
  console.log('BarberList renderizando:', { barbers, isLoading });

  if (isLoading) {
    return (
      <Card className="p-10">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2">Carregando barbeiros...</span>
        </div>
      </Card>
    );
  }

  if (!barbers || barbers.length === 0) {
    return (
      <Card className="p-10">
        <div className="text-center">
          <UserCog className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum barbeiro cadastrado</h3>
          <p className="text-gray-500 mb-4">
            Clique em "Novo Barbeiro" para adicionar o primeiro barbeiro à equipe.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Barbeiro
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contato
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Especialidade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {barbers
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((barber) => (
                <tr key={barber.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {barber.image_url ? (
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={barber.image_url}
                          alt={barber.name}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <UserCog className="h-5 w-5 text-gray-500" />
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {barber.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {barber.role || 'Barbeiro'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{barber.email || '-'}</div>
                    <div className="text-sm text-gray-500">{barber.phone || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {barber.specialties || '-'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {barber.experience ? `${barber.experience}` : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {barber.is_active ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Ativo
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Inativo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(barber.id)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
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
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default BarberList;
