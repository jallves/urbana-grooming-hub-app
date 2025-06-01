
import React, { useState } from 'react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Edit, MoreHorizontal, Trash2, Phone, Mail, Download } from 'lucide-react';
import { Client } from '@/types/client';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientListProps {
  clients: Client[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onDelete: () => void;
}

const ClientList: React.FC<ClientListProps> = ({ clients, isLoading, onEdit, onDelete }) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!clientToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientToDelete.id);
      
      if (error) throw error;
      
      toast.success('Cliente removido com sucesso!');
      onDelete();
    } catch (error) {
      toast.error('Erro ao remover cliente', {
        description: (error as Error).message
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };

  const confirmDelete = (client: Client) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const exportToExcel = () => {
    const excelData = clients.map(client => ({
      'Nome': client.name,
      'E-mail': client.email || '-',
      'Telefone': client.phone,
      'WhatsApp': client.whatsapp || '-',
      'Data de Nascimento': client.birth_date ? format(new Date(client.birth_date), 'dd/MM/yyyy') : '-',
      'Data de Cadastro': format(new Date(client.created_at || ''), 'dd/MM/yyyy HH:mm')
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');
    
    // Ajustar largura das colunas
    const colWidths = [
      { wch: 25 }, // Nome
      { wch: 30 }, // E-mail
      { wch: 15 }, // Telefone
      { wch: 15 }, // WhatsApp
      { wch: 18 }, // Data de Nascimento
      { wch: 20 }  // Data de Cadastro
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `clientes_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
    toast.success('Arquivo Excel gerado com sucesso!');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Carregando clientes...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (clients.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-lg font-medium">Nenhum cliente cadastrado</p>
              <p className="text-sm text-muted-foreground mt-1">Clique em "Novo Cliente" para adicionar</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Lista de Clientes ({clients.length})</h3>
            <Button onClick={exportToExcel} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Data de Nascimento</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>
                      {client.email ? (
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{client.email}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">{client.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.whatsapp ? (
                        <div className="flex items-center space-x-1">
                          <Phone className="h-3.5 w-3.5 text-green-600" />
                          <span className="text-sm">{client.whatsapp}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {client.birth_date ? (
                        <span className="text-sm">
                          {format(new Date(client.birth_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {format(new Date(client.created_at || ''), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(client.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => confirmDelete(client)} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o cliente "{clientToDelete?.name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClientList;
