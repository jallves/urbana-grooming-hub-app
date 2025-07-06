
import React from 'react';
import { Table, TableBody } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Client } from '@/types/client';
import ClientTableHeader from './components/ClientTableHeader';
import ClientTableRow from './components/ClientTableRow';
import ExportButton from './components/ExportButton';
import DeleteClientDialog from './components/DeleteClientDialog';
import EmptyClientState from './components/EmptyClientState';
import LoadingClientState from './components/LoadingClientState';
import { useClientDelete } from './hooks/useClientDelete';

interface ClientListProps {
  clients: Client[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onDelete: () => void;
}

const ClientList: React.FC<ClientListProps> = ({ clients, isLoading, onEdit, onDelete }) => {
  const {
    deleteDialogOpen,
    setDeleteDialogOpen,
    clientToDelete,
    isDeleting,
    handleDelete,
    confirmDelete
  } = useClientDelete(onDelete);

  if (isLoading) {
    return <LoadingClientState />;
  }

  if (clients.length === 0) {
    return <EmptyClientState />;
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <Card className="w-full">
        <CardContent className="p-2 sm:p-3 md:p-4">
          {/* Header com contador e botão de exportação - Responsivo */}
          <div className="flex flex-col gap-2 mb-3 sm:flex-row sm:justify-between sm:items-center sm:mb-4">
            <h3 className="text-sm font-semibold sm:text-base md:text-lg">
              Lista de Clientes ({clients.length})
            </h3>
            <div className="flex-shrink-0">
              <ExportButton clients={clients} />
            </div>
          </div>
          
          {/* Tabela com scroll horizontal para mobile */}
          <div className="w-full overflow-x-auto">
            <div className="min-w-[600px] sm:min-w-[700px] lg:min-w-full">
              <Table>
                <ClientTableHeader />
                <TableBody>
                  {clients.map((client) => (
                    <ClientTableRow
                      key={client.id}
                      client={client}
                      onEdit={onEdit}
                      onDelete={confirmDelete}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <DeleteClientDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        client={clientToDelete}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default ClientList;
