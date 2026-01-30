// Mapeamento centralizado de categorias financeiras
// Mantém consistência em toda a aplicação

export const CATEGORY_LABELS: Record<string, string> = {
  // Receitas
  'services': 'Serviços',
  'products': 'Produtos',
  'product': 'Produtos',
  'Produto': 'Produtos',
  'Produtos': 'Produtos',
  'service': 'Serviços',
  'Serviço': 'Serviços',
  'Serviços': 'Serviços',
  'other': 'Outros',
  'Outros': 'Outros',
  
  // Despesas
  'supplies': 'Insumos',
  'Insumos': 'Insumos',
  'rent': 'Aluguel',
  'Aluguel': 'Aluguel',
  'utilities': 'Utilidades',
  'Utilidades': 'Utilidades',
  'marketing': 'Marketing',
  'Marketing': 'Marketing',
  'commissions': 'Comissões',
  'Comissões': 'Comissões',
  'expenses': 'Despesas Gerais',
  'Despesas Gerais': 'Despesas Gerais',
  
  // Gorjetas (tips)
  'tips': 'Gorjetas',
  'tip': 'Gorjetas',
  'Tips': 'Gorjetas',
  'Tip': 'Gorjetas',
  'gorjeta': 'Gorjetas',
  'Gorjeta': 'Gorjetas',
  'Gorjetas': 'Gorjetas',
  
  // Comissões
  'staff_payments': 'Pagamento de Funcionários',
  'Pagamento de Funcionários': 'Pagamento de Funcionários',
  'commission': 'Comissões',
  'Commission': 'Comissões',
  'Comissão': 'Comissões',
  
  // Fornecedores
  'suppliers': 'Fornecedores',
  'Fornecedores': 'Fornecedores',
  
  // Manutenção
  'maintenance': 'Manutenção',
  'Manutenção': 'Manutenção',
};

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  'revenue': 'Receita',
  'expense': 'Despesa',
  'commission': 'Comissão',
  'income': 'Receita',
};

export const STATUS_LABELS: Record<string, string> = {
  'completed': 'Pago',
  'pending': 'Pendente',
  'cancelled': 'Cancelado',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  'cash': 'Dinheiro',
  'debit': 'Cartão de Débito',
  'credit': 'Cartão de Crédito',
  'pix': 'PIX',
  'transfer': 'Transferência',
  'other': 'Outro',
};

// Função auxiliar para obter o label traduzido e normalizado
export const getCategoryLabel = (category: string | null | undefined): string => {
  if (!category) return 'Outros';
  
  // Primeiro tenta o mapeamento direto
  const mapped = CATEGORY_LABELS[category];
  if (mapped) return mapped;
  
  // Tenta com lowercase
  const lowerCategory = category.toLowerCase();
  const lowerMapped = CATEGORY_LABELS[lowerCategory];
  if (lowerMapped) return lowerMapped;
  
  // Retorna o original se não encontrar mapeamento
  return category;
};

export const getTransactionTypeLabel = (type: string): string => {
  return TRANSACTION_TYPE_LABELS[type] || type;
};

export const getStatusLabel = (status: string): string => {
  return STATUS_LABELS[status] || status;
};

export const getPaymentMethodLabel = (method: string): string => {
  return PAYMENT_METHOD_LABELS[method] || method;
};
