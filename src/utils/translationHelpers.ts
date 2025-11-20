// Traduz descrições de transações para português
export const translateDescription = (description: string): string => {
  if (!description) return description;
  
  return description
    .replace(/Product:/gi, 'Produto:')
    .replace(/Service:/gi, 'Serviço:')
    .replace(/Commission:/gi, 'Comissão:')
    .replace(/Comissão produto:/gi, 'Comissão Produto:')
    .replace(/Comissão serviço:/gi, 'Comissão Serviço:');
};
