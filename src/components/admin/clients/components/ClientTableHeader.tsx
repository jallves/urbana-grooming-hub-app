
import React from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

const ClientTableHeader: React.FC = () => {
  return (
    <TableHeader className="bg-gray-100 sticky top-0 z-10">
      <TableRow className="border-b border-gray-200">
        <TableHead className="text-sm font-semibold text-gray-700 px-4 py-3 w-[200px]">
          Nome
        </TableHead>
        
        <TableHead className="text-sm font-semibold text-gray-700 px-4 py-3 w-[200px] hidden sm:table-cell">
          E-mail
        </TableHead>
        
        <TableHead className="text-sm font-semibold text-gray-700 px-4 py-3 w-[150px]">
          Telefone
        </TableHead>
        
        <TableHead className="text-sm font-semibold text-gray-700 px-4 py-3 w-[150px] hidden md:table-cell">
          WhatsApp
        </TableHead>
        
        <TableHead className="text-sm font-semibold text-gray-700 px-4 py-3 w-[120px] hidden lg:table-cell">
          Nascimento
        </TableHead>
        
        <TableHead className="text-sm font-semibold text-gray-700 px-4 py-3 w-[120px] hidden xl:table-cell">
          Cadastro
        </TableHead>
        
        <TableHead className="text-right text-sm font-semibold text-gray-700 px-4 py-3 w-[100px]">
          Ações
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default ClientTableHeader;
