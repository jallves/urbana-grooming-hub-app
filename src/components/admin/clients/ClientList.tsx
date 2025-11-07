
import React from 'react';
import ClientCard from './components/ClientCard';
import ClientTable from './components/ClientTable';
import ExportButton from './components/ExportButton';
import DeleteClientDialog from './components/DeleteClientDialog';
import EmptyClientState from './components/EmptyClientState';
import LoadingClientState from './components/LoadingClientState';
import { useClientDelete } from './hooks/useClientDelete';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  const isMobile = useIsMobile();
  const {
    deleteDialogOpen,
    setDeleteDialogOpen,
    clientToDelete,
    isDeleting,
    handleDelete,
    confirmDelete
  } = useClientDelete(onDelete);

  if (isLoading) return <LoadingClientState />;
  if (clients.length === 0) return <EmptyClientState />;

  return (
    <Card className="panel-card-responsive">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="panel-title-responsive">
            Lista de Clientes ({clients.length})
          </CardTitle>
          <ExportButton clients={clients} />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Renderização condicional: Tabela para desktop, Cards para mobile */}
        {isMobile ? (
          <div className="panel-grid-responsive">
            {clients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onEdit={onEdit}
                onDelete={confirmDelete}
              />
            ))}
          </div>
        ) : (
          <ClientTable
            clients={clients}
            onEdit={onEdit}
            onDelete={confirmDelete}
          />
        )}
      </CardContent>
      
      <DeleteClientDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        client={clientToDelete}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </Card>
  );
};

export default ClientList;
