import React from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

const ClientTableHeader: React.FC = () => {
  return (
    <TableHeader className="bg-gray-100 sticky top-0 z-10">
      <TableRow className="border-b border-gray-200">
        {/* Nome */}
        <TableHead className="text-xs sm:text-sm font-semibold text-gray-700 px-2 sm:px-4 py-2 sm:py-3 w-[150px] sm:w-[200px]">
          Nome
        </TableHead>

        {/* E-mail - escondido no mobile */}
        <TableHead className="text-xs sm:text-sm font-semibold text-gray-700 px-2 sm:px-4 py-2 sm:py-3 w-[180px] hidden sm:table-cell">
          E-mail
        </TableHead>

        {/* WhatsApp */}
        <TableHead className="text-xs sm:text-sm font-semibold text-gray-700 px-2 sm:px-4 py-2 sm:py-3 w-[120px] sm:w-[150px]">
          WhatsApp
        </TableHead>

        {/* Data de Nascimento - escondida em telas pequenas */}
        <TableHead className="text-xs sm:text-sm font-semibold text-gray-700 px-2 sm:px-4 py-2 sm:py-3 w-[100px] hidden lg:table-cell">
          Nascimento
        </TableHead>

        {/* Data de Cadastro - escondida em telas médias */}
        <TableHead className="text-xs sm:text-sm font-semibold text-gray-700 px-2 sm:px-4 py-2 sm:py-3 w-[100px] hidden xl:table-cell">
          Cadastro
        </TableHead>

        {/* Ações */}
        <TableHead className="text-right text-xs sm:text-sm font-semibold text-gray-700 px-2 sm:px-4 py-2 sm:py-3 w-[80px] sm:w-[100px]">
          Ações
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default ClientTableHeader;
