import { supabase } from '@/integrations/supabase/client';

export interface TEFPaymentRequest {
  terminalId: string;
  amount: number;
  paymentType: 'credit' | 'debit' | 'pix';
  installments?: number;
  callbackUrl?: string;
  reference?: string;
  softDescriptor?: string;
}

export interface TEFPaymentResponse {
  paymentId: string;
  status: 'processing' | 'approved' | 'declined' | 'canceled' | 'expired';
  authorizationCode?: string;
  nsu?: string;
  cardBrand?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TEFSettings {
  useMock: boolean;
  terminalId: string;
  apiUrl: string;
  apiKey?: string;
  webhookUrl?: string;
  timeoutSeconds: number;
}

class TEFDriver {
  private settings: TEFSettings | null = null;

  async loadSettings(): Promise<TEFSettings> {
    if (this.settings) {
      return this.settings;
    }

    const { data, error } = await supabase
      .from('tef_settings')
      .select('*')
      .single();

    if (error || !data) {
      throw new Error('Configurações TEF não encontradas');
    }

    this.settings = {
      useMock: data.use_mock,
      terminalId: data.terminal_id,
      apiUrl: data.api_url,
      apiKey: data.api_key,
      webhookUrl: data.webhook_url,
      timeoutSeconds: data.timeout_seconds
    };

    return this.settings;
  }

  async createPayment(request: TEFPaymentRequest): Promise<TEFPaymentResponse> {
    const settings = await this.loadSettings();
    
    const url = `${settings.apiUrl}/payments`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (!settings.useMock && settings.apiKey) {
      headers['Authorization'] = `Bearer ${settings.apiKey}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...request,
        terminalId: request.terminalId || settings.terminalId
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar pagamento');
    }

    return await response.json();
  }

  async getPaymentStatus(paymentId: string): Promise<TEFPaymentResponse> {
    const settings = await this.loadSettings();
    
    const url = `${settings.apiUrl}/payments/${paymentId}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (!settings.useMock && settings.apiKey) {
      headers['Authorization'] = `Bearer ${settings.apiKey}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao consultar pagamento');
    }

    return await response.json();
  }

  async cancelPayment(paymentId: string): Promise<TEFPaymentResponse> {
    const settings = await this.loadSettings();
    
    const url = `${settings.apiUrl}/payments/${paymentId}/cancel`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (!settings.useMock && settings.apiKey) {
      headers['Authorization'] = `Bearer ${settings.apiKey}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao cancelar pagamento');
    }

    return await response.json();
  }

  clearCache() {
    this.settings = null;
  }
}

export const tefDriver = new TEFDriver();