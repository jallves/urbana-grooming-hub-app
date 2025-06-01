
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
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Lista de Clientes ({clients.length})</h3>
            <ExportButton clients={clients} />
          </div>
          
          <div className="overflow-x-auto">
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
        </CardContent>
      </Card>
      
      <DeleteClientDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        client={clientToDelete}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default ClientList;
