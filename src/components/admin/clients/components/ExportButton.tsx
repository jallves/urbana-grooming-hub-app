
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Client } from '@/types/client';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface ExportButtonProps {
  clients: Client[];
}

const ExportButton: React.FC<ExportButtonProps> = ({ clients }) => {
  const handleExport = () => {
    try {
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
      
      XLSX.writeFile(workbook, `clientes_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success('Arquivo exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar arquivo');
      console.error('Export error:', error);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      className="text-xs sm:text-sm"
      disabled={clients.length === 0}
    >
      <Download className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
      <span className="hidden sm:inline">Exportar</span>
      <span className="sm:hidden">Excel</span>
    </Button>
  );
};

export default ExportButton;
