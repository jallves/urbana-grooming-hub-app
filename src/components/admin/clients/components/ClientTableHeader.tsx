
import React from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

const ClientTableHeader: React.FC = () => {
  return (
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
  );
};

export default ClientTableHeader;
