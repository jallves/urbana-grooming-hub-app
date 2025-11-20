// Mapeamento centralizado de categorias financeiras
// Mantém consistência em toda a aplicação

export const CATEGORY_LABELS: Record<string, string> = {
  // Receitas
  'services': 'Serviços',
  'products': 'Produtos',
  'product': 'Produto',
  'service': 'Serviço',
  'other': 'Outros',
  
  // Despesas
  'supplies': 'Insumos',
  'rent': 'Aluguel',
  'utilities': 'Utilidades',
  'marketing': 'Marketing',
  'commissions': 'Comissões',
  'expenses': 'Despesas Gerais',
  
  // Comissões
  'staff_payments': 'Pagamento de Funcionários',
  'commission': 'Comissão',
  
  // Traduções de descrições específicas
  'Product': 'Produto',
  'Service': 'Serviço',
  'Commission': 'Comissão',
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

// Função auxiliar para obter o label traduzido
export const getCategoryLabel = (category: string): string => {
  return CATEGORY_LABELS[category] || category;
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
