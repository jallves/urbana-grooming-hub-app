
import React, { useState, useMemo } from 'react';
import ClientCard from './components/ClientCard';
import ClientTable from './components/ClientTable';
import ExportButton from './components/ExportButton';
import DeleteClientDialog from './components/DeleteClientDialog';
import EmptyClientState from './components/EmptyClientState';
import LoadingClientState from './components/LoadingClientState';
import { useClientDelete } from './hooks/useClientDelete';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PainelClient {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  whatsapp: string | null;
  data_nascimento: string | null;
  created_at: string;
  updated_at: string;
  ultimo_agendamento: { data: string; hora: string; status: string | null } | null;
}

const EMPTY_FILTERS = {
  nome: '',
  email: '',
  telefone: '',
  whatsapp: '',
};

const normalizeText = (value: string | null | undefined) => value?.toLowerCase().trim() ?? '';
const normalizePhone = (value: string | null | undefined) => value?.replace(/\D/g, '') ?? '';

interface ClientListProps {
  clients: PainelClient[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onDelete: () => void;
}

const ClientList: React.FC<ClientListProps> = ({ clients, isLoading, onEdit, onDelete }) => {
  const useCardLayout = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const {
    deleteDialogOpen,
    setDeleteDialogOpen,
    clientToDelete,
    isDeleting,
    handleDelete,
    confirmDelete
  } = useClientDelete(onDelete);

  const filteredClients = useMemo(() => {
    const nomeQuery = normalizeText(filters.nome);
    const emailQuery = normalizeText(filters.email);
    const telefoneQuery = normalizePhone(filters.telefone);
    const whatsappQuery = normalizePhone(filters.whatsapp);

    if (!nomeQuery && !emailQuery && !telefoneQuery && !whatsappQuery) return clients;

    return clients.filter((client) => {
      const nomeMatches = !nomeQuery || normalizeText(client.nome).includes(nomeQuery);
      const emailMatches = !emailQuery || normalizeText(client.email).includes(emailQuery);
      const telefoneMatches = !telefoneQuery || normalizePhone(client.telefone).includes(telefoneQuery);
      const whatsappMatches = !whatsappQuery || normalizePhone(client.whatsapp).includes(whatsappQuery);

      return nomeMatches && emailMatches && telefoneMatches && whatsappMatches;
    });
  }, [clients, filters]);

  const hasActiveFilters = Object.values(filters).some((value) => value.trim() !== '');

  const updateFilter = (field: keyof typeof EMPTY_FILTERS) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  if (isLoading) return <LoadingClientState />;
  if (clients.length === 0) return <EmptyClientState />;

  return (
    <Card className="panel-card-responsive">
      <CardHeader className="pb-4 px-4 md:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base sm:text-lg md:text-xl font-semibold">
            Lista de Clientes ({filteredClients.length}{hasActiveFilters ? ` de ${clients.length}` : ''})
          </CardTitle>
          <ExportButton clients={filteredClients} />
        </div>
        <div className="mt-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              aria-label="Filtrar clientes por nome"
              placeholder="Filtrar por nome..."
              value={filters.nome}
              onChange={updateFilter('nome')}
              className="pl-9 h-9 text-sm"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Input
              aria-label="Filtrar clientes por e-mail"
              placeholder="Filtrar por e-mail..."
              value={filters.email}
              onChange={updateFilter('email')}
              className="h-9 text-sm"
            />
            <Input
              aria-label="Filtrar clientes por telefone"
              placeholder="Filtrar por telefone..."
              value={filters.telefone}
              onChange={updateFilter('telefone')}
              className="h-9 text-sm"
            />
            <Input
              aria-label="Filtrar clientes por WhatsApp"
              placeholder="Filtrar por WhatsApp..."
              value={filters.whatsapp}
              onChange={updateFilter('whatsapp')}
              className="h-9 text-sm"
            />
          </div>

          {hasActiveFilters && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => setFilters(EMPTY_FILTERS)}
              >
                <X className="h-4 w-4" />
                Limpar filtros
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 px-4 md:px-6">
        {filteredClients.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum cliente encontrado com os filtros informados.
          </p>
        ) : useCardLayout ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {filteredClients.map((client) => (
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
            clients={filteredClients}
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
