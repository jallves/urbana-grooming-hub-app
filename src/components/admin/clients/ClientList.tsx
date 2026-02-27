
import React from 'react';
import ClientCard from './components/ClientCard';
import ClientTable from './components/ClientTable';
import ExportButton from './components/ExportButton';
import DeleteClientDialog from './components/DeleteClientDialog';
import EmptyClientState from './components/EmptyClientState';
import LoadingClientState from './components/LoadingClientState';
import { useClientDelete } from './hooks/useClientDelete';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PainelClient {
  id: string;
  nome: string;
  email: string | null;
  whatsapp: string;
  data_nascimento: string | null;
  created_at: string;
  updated_at: string;
  ultimo_agendamento: { data: string; hora: string; status: string | null } | null;
}

interface ClientListProps {
  clients: PainelClient[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onDelete: () => void;
}

const ClientList: React.FC<ClientListProps> = ({ clients, isLoading, onEdit, onDelete }) => {
  // Usa cards em mobile e tablets pequenos (até 768px)
  const useCardLayout = useMediaQuery('(max-width: 768px)');
  // Tablet médio (768-1024px) - tabela compacta
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
  
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
      <CardHeader className="pb-4 px-4 md:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base sm:text-lg md:text-xl font-semibold">
            Lista de Clientes ({clients.length})
          </CardTitle>
          <ExportButton clients={clients} />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 px-4 md:px-6">
        {/* Cards para mobile/tablets pequenos, Tabela para tablets médios/desktop */}
        {useCardLayout ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
            compact={isTablet}
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
