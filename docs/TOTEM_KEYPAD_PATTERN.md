# 🔢 Padrão de Teclado com Logo - Totem Costa Urbana

## 📋 Visão Geral

Este documento define o padrão **OBRIGATÓRIO** de teclado numérico com logo para TODAS as telas do Totem que necessitam de entrada de PIN ou autenticação.

---

## 🎯 Onde Usar

O componente `TotemPinKeypad` deve ser usado em:

✅ **Check-in** - Entrada de PIN para check-in  
✅ **Checkout** - Confirmação de pagamento com PIN  
✅ **Produtos e Serviços** - Autenticação para compra  
✅ **Novo Agendamento** - Identificação do cliente  
✅ **Qualquer tela que precise de PIN/autenticação**

---

## 🧩 Componente: TotemPinKeypad

### Importação

```tsx
import { TotemPinKeypad } from '@/components/totem/TotemPinKeypad';
```

### Uso Básico

```tsx
<TotemPinKeypad
  title="Autenticação de Acesso"
  subtitle="Insira o PIN de segurança para acessar o sistema"
  pinLength={4}
  onSubmit={(pin) => {
    console.log('PIN digitado:', pin);
    // Validar PIN e prosseguir
  }}
/>
```

---

## 📐 Especificações Visuais

### 1. Logo com Cantos Decorativos

```
┌─┐         ┌─┐
│ │  LOGO   │ │
│ │         │ │
└─┘         └─┘
```

- Logo: `w-32 h-32` (128x128px)
- Cantos: Bordas de 2px em dourado (`border-urbana-gold`)
- Posicionamento: Centralizado no topo

### 2. Badge "Sistema Exclusivo"

- Background: `bg-urbana-gold/20`
- Borda: `border-urbana-gold/50`
- Texto: Uppercase, tracking-wider
- Ícone: Bolinha pulsante dourada

### 3. Campos de PIN

- Tamanho: `w-14 h-14` (56x56px)
- Espaçamento: `gap-3`
- Quantidade: Configurável (padrão 4)
- Estados:
  - Vazio: `border-urbana-gold/50 bg-urbana-black/40`
  - Preenchido: `border-urbana-gold bg-urbana-gold/10` com glow

### 4. Teclado Numérico

- Layout: Grid 3x4
- Botões: `h-16` (64px altura)
- Números: 1-9 na grid, 0 na linha inferior
- Estilo:
  - Background: `bg-urbana-black/60`
  - Borda: `border-2 border-urbana-gold/40`
  - Texto: `text-2xl font-bold text-urbana-gold`
  - Hover: `bg-urbana-gold/20 border-urbana-gold scale-105`

### 5. Botões Especiais

**Limpar:**
- Posição: Inferior esquerda
- Texto: "Limpar"
- Desabilitado quando PIN vazio

**Backspace:**
- Posição: Inferior direita
- Ícone: `<Delete />`
- Desabilitado quando PIN vazio

**Entrar:**
- Largura: Toda a largura do card
- Altura: `h-14` (56px)
- Gradiente: `from-urbana-gold to-urbana-gold-light`
- Desabilitado até PIN completo

---

## 💻 Exemplos de Implementação

### Exemplo 1: Check-in

```tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TotemPinKeypad } from '@/components/totem/TotemPinKeypad';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const TotemCheckIn: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handlePinSubmit = async (pin: string) => {
    setLoading(true);
    
    try {
      // Validar PIN e buscar agendamentos
      const { data: client, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('telefone', pin)
        .single();

      if (error || !client) {
        toast.error('Cliente não encontrado');
        return;
      }

      // Buscar agendamentos do cliente
      const { data: appointments } = await supabase
        .from('agendamentos')
        .select('*, servico:painel_servicos(*), barbeiro:painel_barbeiros(*)')
        .eq('cliente_id', client.id)
        .gte('data', new Date().toISOString().split('T')[0]);

      navigate('/totem/appointments-list', {
        state: { client, appointments }
      });
    } catch (error) {
      toast.error('Erro ao processar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TotemPinKeypad
      title="Check-in"
      subtitle="Digite seu telefone para fazer check-in"
      pinLength={11}
      onSubmit={handlePinSubmit}
      loading={loading}
    />
  );
};

export default TotemCheckIn;
```

### Exemplo 2: Checkout

```tsx
const TotemCheckOut: React.FC = () => {
  const handlePinSubmit = async (pin: string) => {
    // Validar PIN e processar pagamento
  };

  return (
    <TotemPinKeypad
      title="Checkout"
      subtitle="Confirme o pagamento com seu PIN"
      pinLength={4}
      onSubmit={handlePinSubmit}
      onCancel={() => navigate('/totem/home')}
    />
  );
};
```

### Exemplo 3: Produtos

```tsx
const TotemProdutos: React.FC = () => {
  const handlePinSubmit = async (pin: string) => {
    // Autenticar e mostrar produtos
  };

  return (
    <TotemPinKeypad
      title="Produtos e Serviços"
      subtitle="Autentique-se para ver produtos disponíveis"
      pinLength={4}
      onSubmit={handlePinSubmit}
    />
  );
};
```

---

## 🎨 Props do Componente

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| **title** | string | 'Autenticação de Acesso' | Título principal |
| **subtitle** | string | 'Insira o PIN...' | Subtítulo explicativo |
| **pinLength** | number | 4 | Quantidade de dígitos do PIN |
| **onSubmit** | (pin: string) => void | - | **OBRIGATÓRIO** - Callback com PIN completo |
| **onCancel** | () => void | undefined | Callback para botão cancelar (opcional) |
| **loading** | boolean | false | Estado de carregamento |
| **showDemoPin** | boolean | false | Mostrar PIN de demonstração |

---

## 🔒 Segurança

### Validação de Input

```tsx
// Cliente - validar telefone
const phoneSchema = z.string()
  .regex(/^\d{10,11}$/, 'Telefone inválido')
  .trim();

// PIN - validar formato
const pinSchema = z.string()
  .length(4, 'PIN deve ter 4 dígitos')
  .regex(/^\d{4}$/, 'PIN deve conter apenas números');
```

### Não armazenar PIN

```tsx
// ❌ ERRADO
localStorage.setItem('userPin', pin);

// ✅ CORRETO
// Usar apenas para validação imediata
const isValid = await validatePin(pin);
```

### Rate Limiting

```tsx
// Limitar tentativas de PIN
const MAX_ATTEMPTS = 3;
const [attempts, setAttempts] = useState(0);

const handlePinSubmit = async (pin: string) => {
  if (attempts >= MAX_ATTEMPTS) {
    toast.error('Muitas tentativas. Tente novamente em 5 minutos.');
    return;
  }
  
  const isValid = await validatePin(pin);
  if (!isValid) {
    setAttempts(prev => prev + 1);
  }
};
```

---

## ✅ Checklist de Implementação

Para cada tela que usa PIN:

- [ ] Importar `TotemPinKeypad`
- [ ] Configurar `pinLength` apropriado (4 para PIN, 10-11 para telefone)
- [ ] Implementar validação de PIN no `onSubmit`
- [ ] Adicionar estado `loading` durante processamento
- [ ] Tratar erros com `toast.error`
- [ ] Implementar rate limiting
- [ ] Não logar PINs no console
- [ ] Testar responsividade (mobile, tablet, desktop)
- [ ] Testar teclado físico (números e Enter)
- [ ] Validar acessibilidade

---

## 🎯 Telas Prioritárias

### Alta Prioridade
1. ✅ TotemLogin.tsx (já usa padrão similar)
2. ⬜ TotemSearch.tsx - Refatorar para usar TotemPinKeypad
3. ⬜ TotemCheckOut.tsx - Implementar com TotemPinKeypad
4. ⬜ TotemProdutos.tsx - Implementar com TotemPinKeypad

### Média Prioridade
5. ⬜ TotemAgendamento.tsx - Usar para identificação
6. ⬜ TotemVipCard.tsx - Autenticação VIP

---

## 🚫 O Que NÃO Fazer

❌ **Não usar input HTML padrão** para PIN  
❌ **Não criar teclados customizados diferentes**  
❌ **Não mostrar PIN em texto plano**  
❌ **Não armazenar PIN localmente**  
❌ **Não logar PIN no console em produção**  

---

## 📞 Suporte

Para dúvidas sobre implementação:
1. Consulte `TOTEM_DESIGN_SYSTEM.md`
2. Veja `TotemPinKeypad.tsx` para referência
3. Entre em contato com a equipe

**Status:** 🟢 Ativo  
**Última Atualização:** Novembro 2025
