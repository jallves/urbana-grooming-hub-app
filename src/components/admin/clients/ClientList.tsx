import React from 'react';
import { Table, TableBody } from '@/components/ui/table';
import ClientTableHeader from './components/ClientTableHeader';
import ClientTableRow from './components/ClientTableRow';
import ExportButton from './components/ExportButton';
import DeleteClientDialog from './components/DeleteClientDialog';
import EmptyClientState from './components/EmptyClientState';
import LoadingClientState from './components/LoadingClientState';
import { useClientDelete } from './hooks/useClientDelete';
import { useWindowSize } from '@/hooks/useWindowSize';

interface PainelClient {
  id: string;
  nome: string;
  email: string | null;
  whatsapp: string;
  data_nascimento: string | null;
  created_at: string;
  updated_at: string;
}

interface ClientListProps {
  clients: PainelClient[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onDelete: () => void;
}

const ClientList: React.FC<ClientListProps> = ({ clients, isLoading, onEdit, onDelete }) => {
  const { width } = useWindowSize();
  const isMobile = width < 640;
  
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
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header com contador e botão de exportação */}
      <div className="flex-shrink-0 px-4 py-3 sm:px-6 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <div className="flex items-center gap-2">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
              Clientes Cadastrados
            </h3>
            <div className="px-3 py-1 bg-gray-900 text-white rounded-full text-sm sm:text-base font-medium">
              {clients.length}
            </div>
          </div>
          <div className="flex-shrink-0 w-full sm:w-auto">
            <ExportButton clients={clients} />
          </div>
        </div>
      </div>
      
      {/* Tabela com scroll */}
      <div className="flex-1 overflow-auto bg-white">
        <div className="min-w-full inline-block align-middle">
          <Table className="min-w-full">
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

      {/* Indicador de scroll para mobile */}
      {isMobile && (
        <div className="flex-shrink-0 p-2 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500">
            ← Deslize horizontalmente para ver mais informações →
          </p>
        </div>
      )}
      
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
