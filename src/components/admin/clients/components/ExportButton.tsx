
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Client } from '@/types/client';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ExportButtonProps {
  clients: Client[];
}

const ExportButton: React.FC<ExportButtonProps> = ({ clients }) => {
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

  return (
    <Button onClick={exportToExcel} variant="outline" size="sm">
      <Download className="h-4 w-4 mr-2" />
      Exportar Excel
    </Button>
  );
};

export default ExportButton;
