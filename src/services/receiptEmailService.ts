import { supabase } from '@/integrations/supabase/client';

interface ReceiptEmailData {
  clientName: string;
  clientEmail: string;
  transactionType: 'service' | 'product';
  items: Array<{
    name: string;
    quantity?: number;
    price: number;
  }>;
  total: number;
  paymentMethod: string;
  transactionDate: string;
  nsu?: string;
  barberName?: string;
}

export async function sendReceiptEmail(data: ReceiptEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[sendReceiptEmail] Enviando comprovante para:', data.clientEmail);
    
    const { data: result, error } = await supabase.functions.invoke('send-receipt-email', {
      body: data
    });

    if (error) {
      console.error('[sendReceiptEmail] Erro ao enviar:', error);
      return { success: false, error: error.message };
    }

    console.log('[sendReceiptEmail] Comprovante enviado com sucesso:', result);
    return { success: true };
  } catch (err: any) {
    console.error('[sendReceiptEmail] Erro inesperado:', err);
    return { success: false, error: err.message };
  }
}

export async function getCurrentUserEmail(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.email || null;
  } catch {
    return null;
  }
}
