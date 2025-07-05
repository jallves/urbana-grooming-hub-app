
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
  searchQuery: string;
  statusFilter: string;
  clients?: Client[];
  isLoading?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: () => void;
}

const ClientList: React.FC<ClientListProps> = ({ 
  searchQuery, 
  statusFilter, 
  clients = [], 
  isLoading = false, 
  onEdit = () => {}, 
  onDelete = () => {} 
}) => {
  const {
    deleteDialogOpen,
    setDeleteDialogOpen,
    clientToDelete,
    isDeleting,
    handleDelete,
    confirmDelete
  } = useClientDelete(onDelete);

  // Filter clients based on search and status
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.phone.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return <LoadingClientState />;
  }

  if (filteredClients.length === 0) {
    return <EmptyClientState />;
  }

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Lista de Clientes ({filteredClients.length})</h3>
            <ExportButton clients={filteredClients} />
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <ClientTableHeader />
              <TableBody>
                {filteredClients.map((client) => (
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
