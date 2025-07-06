
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Client } from '@/types/client';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface ExportButtonProps {
  clients: Client[];
}

const ExportButton: React.FC<ExportButtonProps> = ({ clients }) => {
  const handleExport = () => {
    try {
      if (clients.length === 0) {
        toast.error('Nenhum cliente para exportar');
        return;
      }

      const exportData = clients.map(client => ({
        Nome: client.name,
        Email: client.email || '',
        Telefone: client.phone,
        WhatsApp: client.whatsapp || '',
        'Data de Nascimento': client.birth_date || '',
        'Data de Cadastro': client.created_at ? new Date(client.created_at).toLocaleDateString('pt-BR') : ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');
      
      const fileName = `clientes_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast.success(`Arquivo "${fileName}" exportado com sucesso!`, {
        description: `${clients.length} clientes exportados`
      });
    } catch (error) {
      toast.error('Erro ao exportar arquivo', {
        description: 'Tente novamente em alguns instantes'
      });
      console.error('Export error:', error);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={clients.length === 0}
      className="w-full sm:w-auto text-xs sm:text-sm font-medium border-primary/20 hover:border-primary hover:bg-primary/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="flex items-center gap-1 sm:gap-2">
        <FileSpreadsheet className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="hidden xs:inline sm:inline">Exportar</span>
        <span className="xs:hidden sm:hidden">Excel</span>
        <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
          ({clients.length})
        </div>
      </div>
    </Button>
  );
};

export default ExportButton;
