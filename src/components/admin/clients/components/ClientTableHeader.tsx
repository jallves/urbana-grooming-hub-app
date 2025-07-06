
import React from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

const ClientTableHeader: React.FC = () => {
  return (
    <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
      <TableRow className="border-b border-gray-200 dark:border-gray-700">
        <TableHead className="min-w-[120px] w-[120px] text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 px-2 sm:px-4 py-3">
          Nome
        </TableHead>
        
        <TableHead className="min-w-[140px] w-[140px] text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 px-2 sm:px-4 py-3 hidden sm:table-cell">
          E-mail
        </TableHead>
        
        <TableHead className="min-w-[100px] w-[100px] text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 px-2 sm:px-4 py-3">
          Telefone
        </TableHead>
        
        <TableHead className="min-w-[100px] w-[100px] text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 px-2 sm:px-4 py-3 hidden md:table-cell">
          WhatsApp
        </TableHead>
        
        <TableHead className="min-w-[110px] w-[110px] text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 px-2 sm:px-4 py-3 hidden lg:table-cell">
          Nascimento
        </TableHead>
        
        <TableHead className="min-w-[110px] w-[110px] text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 px-2 sm:px-4 py-3 hidden xl:table-cell">
          Cadastro
        </TableHead>
        
        <TableHead className="text-right min-w-[80px] w-[80px] text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 px-2 sm:px-4 py-3">
          Ações
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default ClientTableHeader;
