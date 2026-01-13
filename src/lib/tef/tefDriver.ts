/**
 * TEF Driver simplificado
 * A tabela tef_settings não existe no banco, então usamos configurações locais
 */

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

// Configurações padrão para modo mock
const DEFAULT_SETTINGS: TEFSettings = {
  useMock: true,
  terminalId: 'MOCK-001',
  apiUrl: '/api/tef-mock',
  apiKey: '',
  webhookUrl: '',
  timeoutSeconds: 30
};

class TEFDriver {
  private settings: TEFSettings | null = null;

  async loadSettings(): Promise<TEFSettings> {
    if (this.settings) {
      return this.settings;
    }

    // Usar configurações padrão (mock)
    // A tabela tef_settings não existe no banco
    this.settings = DEFAULT_SETTINGS;
    console.log('TEF: Usando configurações mock (tabela tef_settings não existe)');

    return this.settings;
  }

  async createPayment(request: TEFPaymentRequest): Promise<TEFPaymentResponse> {
    const settings = await this.loadSettings();
    
    if (settings.useMock) {
      // Simular pagamento no modo mock
      console.log('TEF Mock: Criando pagamento simulado', request);
      
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        paymentId: `MOCK-${Date.now()}`,
        status: 'approved',
        authorizationCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        nsu: Math.random().toString().substring(2, 14),
        cardBrand: request.paymentType === 'pix' ? 'PIX' : 'VISA',
        createdAt: new Date().toISOString()
      };
    }

    const url = `${settings.apiUrl}/payments`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (settings.apiKey) {
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
    
    if (settings.useMock) {
      // Simular status no modo mock
      return {
        paymentId,
        status: 'approved',
        createdAt: new Date().toISOString()
      };
    }
    
    const url = `${settings.apiUrl}/payments/${paymentId}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (settings.apiKey) {
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
    
    if (settings.useMock) {
      // Simular cancelamento no modo mock
      return {
        paymentId,
        status: 'canceled',
        createdAt: new Date().toISOString()
      };
    }
    
    const url = `${settings.apiUrl}/payments/${paymentId}/cancel`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (settings.apiKey) {
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
