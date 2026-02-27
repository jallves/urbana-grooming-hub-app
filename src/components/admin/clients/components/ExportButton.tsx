
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
  updated_at: string;
  ultimo_agendamento: { data: string; hora: string; status: string | null } | null;
}

interface ExportButtonProps {
  clients: PainelClient[];
}

const ExportButton: React.FC<ExportButtonProps> = ({ clients }) => {
  const handleExport = () => {
    try {
      const exportData = clients.map(client => ({
        Nome: client.nome,
        Email: client.email || '',
        WhatsApp: client.whatsapp,
        'Data de Nascimento': client.data_nascimento ? 
          new Date(client.data_nascimento).toLocaleDateString('pt-BR') : '',
        'Data de Cadastro': new Date(client.created_at).toLocaleDateString('pt-BR')
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
      
      const fileName = `clientes_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar relatório');
    }
  };

  return (
    <Button
      onClick={handleExport}
      variant="outline"
      size="sm"
      className="panel-button-responsive border-gray-600 hover:border-urbana-gold hover:text-urbana-gold"
      disabled={clients.length === 0}
    >
      <Download className="h-4 w-4 mr-2" />
      <span className="hidden sm:inline">Exportar</span>
      <span className="sm:hidden">Excel</span>
    </Button>
  );
};

export default ExportButton;
