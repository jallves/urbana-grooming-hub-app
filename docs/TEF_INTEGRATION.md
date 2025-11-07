# Integração TEF PayGo - Costa Urbana Barbearia

## 📋 Visão Geral

Sistema completo de homologação TEF com mock da API PayGo TESS, permitindo testar todo o fluxo de pagamento antes de conectar à API real.

## 🏗️ Arquitetura

```
┌─────────────────┐
│     TOTEM       │
│   (Frontend)    │
└────────┬────────┘
         │
    useTEF Hook
         │
┌────────▼────────┐
│   TEF Driver    │
│  (tefDriver.ts) │
└────────┬────────┘
         │
    ┌────▼────┐
    │ Mock?   │
    └─┬────┬──┘
      │    │
   SIM│    │NÃO
      │    │
┌─────▼──┐ │  ┌────────────┐
│  Mock  │ │  │ PayGo TESS │
│   API  │ │  │  (Real)    │
└────┬───┘ │  └──────┬─────┘
     │     │         │
     └─────┴─────────┘
           │
    ┌──────▼──────┐
    │   Webhook   │
    │  (Backend)  │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │  Database   │
    │  Realtime   │
    └─────────────┘
```

## 🚀 Componentes Criados

### 1. **Database Tables**
- `tef_mock_transactions` - Armazena transações mock
- `tef_settings` - Configurações do TEF (mock/produção)

### 2. **Edge Functions**
- `tef-mock` - Simula a API TESS da PayGo
- `tef-webhook` - Processa callbacks de pagamento

### 3. **Frontend Components**
- `TEFHomologacao` - Painel de simulação para aprovar/recusar pagamentos
- `TEFSettingsForm` - Formulário de configuração
- `TEFPaymentModal` - Modal de pagamento para o Totem
- `useTEF` - Hook customizado para gerenciar pagamentos

### 4. **Libraries**
- `tefDriver.ts` - Driver que alterna entre mock e produção

## 📝 Como Usar

### No Painel Admin

1. Acesse **Configurações > TEF Homologação**
2. Inicie um pagamento no Totem
3. Use os botões para simular:
   - ✅ Aprovar
   - ❌ Recusar
   - ⏱️ Expirar

### No Totem (Exemplo de Código)

```tsx
import TEFPaymentModal from '@/components/totem/TEFPaymentModal';
import { useState } from 'react';

function CheckoutTotem() {
  const [showPayment, setShowPayment] = useState(false);
  const totalAmount = 4500; // R$ 45,00 em centavos

  const handlePaymentSuccess = (paymentId: string, authCode: string) => {
    console.log('Pagamento aprovado!', { paymentId, authCode });
    // Finalizar atendimento
    // Registrar no fluxo de caixa
    // Gerar recibo
    setShowPayment(false);
  };

  const handlePaymentError = (error: string) => {
    console.error('Erro no pagamento:', error);
    // Mostrar mensagem de erro
    // Permitir tentar novamente
  };

  return (
    <div>
      <button onClick={() => setShowPayment(true)}>
        Pagar com Cartão
      </button>

      <TEFPaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        amount={totalAmount}
        paymentType="credit"
        installments={1}
        reference={`totem_${Date.now()}`}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    </div>
  );
}
```

### Usando o Hook Diretamente

```tsx
import { useTEF } from '@/hooks/useTEF';

function CustomPayment() {
  const { 
    isProcessing, 
    currentPayment, 
    startPayment, 
    cancelPayment 
  } = useTEF();

  const handlePay = async () => {
    try {
      const payment = await startPayment({
        amount: 5000, // R$ 50,00
        paymentType: 'credit',
        installments: 2,
        reference: 'order_123'
      });
      
      console.log('Pagamento iniciado:', payment.paymentId);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  return (
    <div>
      {!isProcessing ? (
        <button onClick={handlePay}>Iniciar Pagamento</button>
      ) : (
        <div>
          <p>Status: {currentPayment?.status}</p>
          <button onClick={cancelPayment}>Cancelar</button>
        </div>
      )}
    </div>
  );
}
```

## 🔄 Fluxo Completo

### 1. Iniciando Pagamento
```javascript
const payment = await tefDriver.createPayment({
  amount: 4500,           // R$ 45,00
  paymentType: 'credit',
  installments: 1,
  reference: 'totem_001'
});
// Retorna: { paymentId: 'mock_xyz', status: 'processing' }
```

### 2. Simulando Resposta (Admin)
- Admin acessa **TEF Homologação**
- Vê transação pendente
- Clica em "Aprovar", "Recusar" ou "Expirar"

### 3. Webhook Processa
```javascript
// Webhook recebe:
{
  paymentId: 'mock_xyz',
  status: 'approved',
  authorizationCode: '123456',
  amount: 4500
}
```

### 4. Realtime Atualiza Totem
```javascript
// useTEF detecta mudança via realtime
useEffect(() => {
  // Escuta mudanças no banco
  supabase.channel('tef-payment-xyz')
    .on('UPDATE', (payload) => {
      // Atualiza UI automaticamente
      setCurrentPayment(payload.new);
    });
}, []);
```

### 5. Totem Finaliza
```javascript
if (currentPayment.status === 'approved') {
  // Mostrar "Pagamento Aprovado!"
  // Registrar no caixa
  // Gerar recibo
  // Finalizar atendimento
}
```

## ⚙️ Configurações

### Modo Mock (Homologação)
```sql
UPDATE tef_settings 
SET use_mock = true,
    terminal_id = 'TESTE-0001',
    api_url = 'https://[seu-projeto].supabase.co/functions/v1/tef-mock';
```

### Modo Produção (PayGo Real)
```sql
UPDATE tef_settings 
SET use_mock = false,
    terminal_id = 'PROD-12345',
    api_url = 'https://api.paygo.com.br/tess',
    api_key = 'sua_chave_api_paygo';
```

## 🎯 Endpoints Mock

### POST /tef-mock/payments
Cria nova transação
```json
// Request
{
  "terminalId": "TESTE-0001",
  "amount": 4500,
  "paymentType": "credit",
  "installments": 1,
  "reference": "order_123"
}

// Response
{
  "paymentId": "mock_1699999999_abc",
  "status": "processing",
  "createdAt": "2025-11-07T21:00:00Z"
}
```

### GET /tef-mock/payments/:paymentId
Consulta status
```json
{
  "paymentId": "mock_1699999999_abc",
  "status": "approved",
  "authorizationCode": "123456",
  "amount": 4500,
  "createdAt": "2025-11-07T21:00:00Z"
}
```

### POST /tef-mock/payments/:paymentId/cancel
Cancela transação
```json
{
  "paymentId": "mock_1699999999_abc",
  "status": "canceled",
  "message": "Transação cancelada com sucesso"
}
```

## 🔐 Segurança

- ✅ RLS habilitado em todas as tabelas
- ✅ Apenas admins podem gerenciar transações
- ✅ Webhook valida payloads
- ✅ API Key protegida no banco

## 🧪 Testando

### Cenário 1: Pagamento Aprovado
1. Iniciar pagamento no Totem (R$ 45,00)
2. Admin aprova no painel
3. Totem recebe confirmação em tempo real
4. Registra no caixa automaticamente

### Cenário 2: Pagamento Recusado
1. Iniciar pagamento no Totem
2. Admin recusa no painel
3. Totem mostra erro
4. Permite tentar novamente

### Cenário 3: Timeout/Expiração
1. Iniciar pagamento
2. Admin clica em "Expirar"
3. Totem mostra mensagem de timeout
4. Limpa estado do pagamento

## 🚀 Migração para Produção

Quando receber credenciais da PayGo:

1. Acesse **Configurações > Configurações TEF**
2. Desative "Modo Homologação"
3. Configure:
   - Terminal ID (fornecido pela PayGo)
   - API URL (URL real da TESS)
   - API Key (chave de autenticação)
   - Webhook URL (seu domínio)
4. Salve as configurações
5. Teste com valores baixos primeiro

**Importante**: Nenhum código precisa ser alterado! O driver detecta automaticamente se está em mock ou produção.

## 📊 Monitoramento

- Todas as transações ficam registradas no banco
- Admin pode ver histórico completo
- Logs em tempo real no console
- Edge Functions têm logs próprios

## 🆘 Troubleshooting

### Pagamento não atualiza
- Verificar se realtime está ativo
- Checar logs das Edge Functions
- Confirmar que webhook está funcionando

### Erro ao criar pagamento
- Verificar configurações TEF
- Confirmar URL da API
- Checar se terminal_id está correto

### Modal não abre
- Verificar se useTEF está importado
- Checar console do browser
- Confirmar permissões no banco

## 📞 Contato PayGo

Quando solicitar ambiente de homologação:

**Informações necessárias:**
- CNPJ da empresa
- Nome da aplicação: "Costa Urbana - Totem Barbearia"
- Tipo de integração: TESS Cloud API
- Webhook URL: `https://[seu-dominio]/functions/v1/tef-webhook`

## ✅ Checklist de Implementação

- [x] Database configurado
- [x] Edge functions criadas
- [x] Painel de homologação
- [x] Hook useTEF
- [x] Modal de pagamento
- [x] Driver com toggle mock/prod
- [x] Realtime funcionando
- [ ] Testar no Totem real
- [ ] Solicitar credenciais PayGo
- [ ] Migrar para produção
- [ ] Treinar equipe

---

**Status**: ✅ Ambiente de homologação 100% funcional
**Próximo passo**: Integrar com o fluxo do Totem e solicitar credenciais PayGo