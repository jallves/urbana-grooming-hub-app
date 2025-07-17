
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface PainelClient {
  id: string;
  nome: string;
  email: string | null;
  whatsapp: string;
  data_nascimento: string | null;
  created_at: string;
}

interface ExportButtonProps {
  clients: PainelClient[];
}

const ExportButton: React.FC<ExportButtonProps> = ({ clients }) => {
  const exportToExcel = () => {
    try {
      const exportData = clients.map(client => ({
        'Nome': client.nome,
        'E-mail': client.email || '',
        'WhatsApp': client.whatsapp,
        'Data de Nascimento': client.data_nascimento || '',
        'Data de Cadastro': new Date(client.created_at).toLocaleDateString('pt-BR')
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');

      const fileName = `clientes_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success('Planilha exportada com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar planilha', {
        description: (error as Error).message
      });
    }
  };

  return (
    <Button
      onClick={exportToExcel}
      variant="outline"
      size="sm"
      className="flex items-center gap-2 border-gray-300 hover:border-gray-400"
      disabled={clients.length === 0}
    >
      <Download className="h-4 w-4" />
      Exportar Excel
    </Button>
  );
};

export default ExportButton;
