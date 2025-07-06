
import React from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

const ClientTableHeader: React.FC = () => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="min-w-[120px] text-xs sm:text-sm">Nome</TableHead>
        <TableHead className="min-w-[140px] text-xs sm:text-sm hidden sm:table-cell">E-mail</TableHead>
        <TableHead className="min-w-[100px] text-xs sm:text-sm">Telefone</TableHead>
        <TableHead className="min-w-[100px] text-xs sm:text-sm hidden md:table-cell">WhatsApp</TableHead>
        <TableHead className="min-w-[110px] text-xs sm:text-sm hidden lg:table-cell">Data de Nascimento</TableHead>
        <TableHead className="min-w-[110px] text-xs sm:text-sm hidden xl:table-cell">Data de Cadastro</TableHead>
        <TableHead className="text-right min-w-[80px] text-xs sm:text-sm">Ações</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default ClientTableHeader;
