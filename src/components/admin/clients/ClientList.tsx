
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
import { useWindowSize } from '@/hooks/useWindowSize';

interface ClientListProps {
  clients: Client[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onDelete: () => void;
}

const ClientList: React.FC<ClientListProps> = ({ clients, isLoading, onEdit, onDelete }) => {
  const { width } = useWindowSize();
  const isMobile = width < 640;
  const isTablet = width < 768;
  
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
      <Card className="w-full border-0 shadow-sm">
        <CardContent className="p-2 sm:p-3 md:p-4 lg:p-6">
          {/* Header com contador e botão de exportação - Responsivo */}
          <div className="flex flex-col gap-2 mb-3 sm:flex-row sm:justify-between sm:items-center sm:mb-4 lg:mb-6">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold sm:text-base md:text-lg xl:text-xl text-gray-900 dark:text-white">
                Lista de Clientes
              </h3>
              <div className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs sm:text-sm font-medium">
                {clients.length}
              </div>
            </div>
            <div className="flex-shrink-0 w-full sm:w-auto">
              <ExportButton clients={clients} />
            </div>
          </div>
          
          {/* Tabela com scroll horizontal para mobile */}
          <div className="w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <div className="min-w-[600px] sm:min-w-[700px] md:min-w-[800px] lg:min-w-full">
                <Table className="w-full">
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
          </div>

          {/* Indicador de scroll para mobile */}
          {isMobile && (
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ← Deslize horizontalmente para ver mais informações →
              </p>
            </div>
          )}
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
