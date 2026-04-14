import { supabase } from '@/integrations/supabase/client';

const COFFEE_PRODUCT_ID = 'b59d80f3-5479-4941-afab-5e0e96e5e959';

/**
 * Decrement coffee stock after registering consumption.
 * Uses the existing decrease_product_stock RPC.
 */
export const decrementCoffeeStock = async (quantity: number) => {
  try {
    const { error } = await supabase.rpc('decrease_product_stock', {
      p_product_id: COFFEE_PRODUCT_ID,
      p_quantity: quantity,
    });
    if (error) console.warn('[Coffee] Erro ao abater estoque:', error.message);
  } catch (err) {
    console.warn('[Coffee] Erro ao abater estoque:', err);
  }
};
