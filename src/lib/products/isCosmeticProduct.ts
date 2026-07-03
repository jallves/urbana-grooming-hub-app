/**
 * Regra de negócio:
 * - Produto cosmético (pomada, shampoo, óleo…) → gera comissão ao barbeiro
 *   → o checkout PRECISA vincular um barbeiro.
 * - Produto de consumo (refrigerante, cerveja, água, energético…) → não gera
 *   comissão → o checkout NÃO precisa vincular barbeiro.
 *
 * O critério é objetivo e configurável pelo admin: um produto é considerado
 * cosmético quando possui comissão cadastrada (percentual OU valor fixo > 0).
 * Assim basta o admin definir comissão em produtos como pomadas para que o
 * fluxo passe a exigir barbeiro automaticamente.
 */
export interface CommissionableProduct {
  commission_percentage?: number | null;
  commission_value?: number | null;
}

export function isCosmeticProduct(product: CommissionableProduct | null | undefined): boolean {
  if (!product) return false;
  const pct = Number(product.commission_percentage || 0);
  const val = Number(product.commission_value || 0);
  return pct > 0 || val > 0;
}

export function cartRequiresBarber(
  items: Array<{ product?: CommissionableProduct | null } | CommissionableProduct>
): boolean {
  return items.some((item: any) => {
    const product = 'product' in item ? item.product : item;
    return isCosmeticProduct(product);
  });
}