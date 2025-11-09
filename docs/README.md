# 📚 Documentação do Totem Costa Urbana

Documentação completa do sistema de design e padrões de implementação do Totem de autoatendimento.

---

## 📖 Documentos Principais

### 🚀 Referências Rápidas (COMECE AQUI) ⭐

#### [TOTEM_QUICK_REFERENCE.md](./TOTEM_QUICK_REFERENCE.md)
**Guia de Bolso para Implementação**

- ⚠️ Regra OBRIGATÓRIA do teclado padrão
- ✅ Exemplos corretos vs ❌ Erros comuns
- 📋 Checklist antes de implementar
- 🎯 Telas que devem usar TotemPinKeypad

📌 **USE ESTE DOCUMENTO** sempre que criar/modificar telas do Totem

---

#### [TOTEM_IMPLEMENTATION_RULES.md](./TOTEM_IMPLEMENTATION_RULES.md)
**Regras de Implementação**

- 🔒 5 Regras OBRIGATÓRIAS críticas
- 🎨 Padrões visuais padronizados
- 🚫 Lista de "O Que NUNCA Fazer"
- ✅ Checklist antes de commit

📌 **CONSULTE ESTE DOCUMENTO** antes de fazer commit

---

### 📚 Documentação Detalhada

#### 🎨 [TOTEM_DESIGN_SYSTEM.md](./TOTEM_DESIGN_SYSTEM.md)
**Sistema de Design Completo**

Define todos os padrões visuais e componentes do Totem:
- Padrões de cards com glassmorphism
- Componentes base (Layout, Grid, Buttons)
- Paleta de cores e tokens
- Tipografia e hierarquia
- Animações e transições
- Checklist completo de implementação

📌 **Consulte este documento** antes de criar ou modificar qualquer tela do Totem.

---

#### ✅ [TOTEM_IMPLEMENTATION_CHECKLIST.md](./TOTEM_IMPLEMENTATION_CHECKLIST.md)
**Lista de Implementação**

Lista completa de todas as telas e componentes do Totem que devem seguir o padrão:
- 21 páginas do Totem
- 10+ componentes reutilizáveis
- Status de implementação
- Prioridades definidas
- Refatorações recomendadas

📌 **Use este documento** para acompanhar o progresso da padronização.

---

#### 🧩 [TOTEM_COMPONENTS_USAGE.md](./TOTEM_COMPONENTS_USAGE.md)
**Guia de Uso dos Componentes**

Exemplos práticos de como usar os componentes reutilizáveis:
- `TotemLayout` - Layout padrão
- `TotemCard` - Cards com variantes
- `TotemGrid` - Grid responsivo
- `TotemPinKeypad` - Teclado de autenticação
- Exemplos de código completos
- Props e configurações

📌 **Use este documento** ao implementar novas telas ou refatorar existentes.

---

#### 🔢 [TOTEM_KEYPAD_PATTERN.md](./TOTEM_KEYPAD_PATTERN.md)
**Padrão de Teclado com Logo** ⚠️ **OBRIGATÓRIO**

Define o padrão de teclado numérico que deve ser usado em TODAS as telas de autenticação:
- Especificações visuais completas
- Componente `TotemPinKeypad` 
- Exemplos de implementação
- Segurança e validação
- Telas que devem usar este padrão

📌 **USO OBRIGATÓRIO** em: Check-in, Checkout, Produtos, Novo Agendamento

---

## 🎯 Início Rápido

### Para Criar uma Nova Tela

1. **Leia** `TOTEM_DESIGN_SYSTEM.md` - Seções "Componentes Base" e "Checklist"
2. **Use** componentes de `TOTEM_COMPONENTS_USAGE.md`
3. **Consulte** exemplos existentes (ex: `TotemAppointmentsList.tsx`)
4. **Valide** contra o checklist em `TOTEM_IMPLEMENTATION_CHECKLIST.md`

### Para Refatorar Tela Existente

1. **Verifique** status em `TOTEM_IMPLEMENTATION_CHECKLIST.md`
2. **Compare** com padrões em `TOTEM_DESIGN_SYSTEM.md`
3. **Implemente** usando componentes de `TOTEM_COMPONENTS_USAGE.md`
4. **Marque** como concluído no checklist

### Para Implementar Autenticação/PIN

1. **SEMPRE use** `TotemPinKeypad` de `TOTEM_KEYPAD_PATTERN.md`
2. **Não crie** teclados customizados diferentes
3. **Siga** as especificações de segurança

---

## 🧩 Componentes Reutilizáveis

### Disponíveis

| Componente | Arquivo | Uso |
|------------|---------|-----|
| `TotemLayout` | `src/components/totem/TotemLayout.tsx` | Layout base de todas as telas |
| `TotemCard` | `src/components/totem/TotemCard.tsx` | Cards com glassmorphism |
| `TotemGrid` | `src/components/totem/TotemLayout.tsx` | Grid responsivo |
| `TotemPinKeypad` | `src/components/totem/TotemPinKeypad.tsx` | ⚠️ Teclado de autenticação |

### Exemplo de Uso Completo

```tsx
import React from 'react';
import { Scissors } from 'lucide-react';
import { TotemLayout, TotemGrid } from '@/components/totem/TotemLayout';
import { TotemCard, TotemCardTitle } from '@/components/totem/TotemCard';

const MinhaTelaTotem: React.FC = () => {
  const items = [
    { id: 1, nome: 'Item 1' },
    { id: 2, nome: 'Item 2' },
  ];

  return (
    <TotemLayout
      title="Minha Tela"
      subtitle="Subtítulo explicativo"
      showBackButton
      backPath="/totem/home"
    >
      <TotemGrid columns={3} gap={6}>
        {items.map((item, index) => (
          <TotemCard
            key={item.id}
            icon={Scissors}
            onClick={() => console.log(item)}
            animationDelay={`${index * 0.1}s`}
          >
            <TotemCardTitle>{item.nome}</TotemCardTitle>
          </TotemCard>
        ))}
      </TotemGrid>
    </TotemLayout>
  );
};
```

---

## 🎨 Padrões Visuais Essenciais

### Cards Glassmorphism
```css
bg-white/5 
backdrop-blur-2xl 
border-2 
border-urbana-gold/40 
rounded-2xl 
shadow-[0_8px_32px_rgba(0,0,0,0.4)]
```

### Background Padrão
```tsx
{/* Background image */}
<div className="absolute inset-0 z-0">
  <img src={barbershopBg} className="w-full h-full object-cover" />
  <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/85 via-urbana-black/80 to-urbana-brown/75" />
</div>

{/* Animated glow effects */}
<div className="absolute inset-0 overflow-hidden z-0">
  <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse-slow" />
  <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-urbana-gold-vibrant/10 rounded-full blur-3xl animate-pulse-slow" />
</div>
```

### Botões
```tsx
{/* Primário */}
className="bg-gradient-to-r from-urbana-gold to-urbana-gold-light text-urbana-black hover:scale-105"

{/* Secundário */}
className="border-2 border-urbana-gold/40 bg-white/5 text-urbana-light hover:bg-white/10"
```

---

## 📊 Status da Implementação

### ✅ Concluído (3 telas)
- TotemAppointmentsList.tsx
- TotemAgendamentoSucesso.tsx  
- TotemRating.tsx (parcial)

### 🔄 Em Progresso
- TotemPinKeypad.tsx (componente criado, aguardando implementação)

### ⏳ Pendente (28 telas/componentes)
Consulte `TOTEM_IMPLEMENTATION_CHECKLIST.md` para lista completa

---

## 🎯 Prioridades

### Alta (Usar diariamente)
1. TotemServico.tsx
2. TotemBarbeiro.tsx
3. TotemDataHora.tsx
4. TotemConfirmation.tsx
5. TotemCheckInSuccess.tsx

### Média
6. TotemLogin.tsx
7. TotemHome.tsx
8. TotemNumericKeypad.tsx (refatorar para TotemPinKeypad)

### Baixa
- Modais auxiliares
- Telas de boas-vindas

---

## 🔒 Segurança

### Validação de Inputs

Sempre use validação com Zod:

```tsx
import { z } from 'zod';

const pinSchema = z.string()
  .length(4, 'PIN deve ter 4 dígitos')
  .regex(/^\d{4}$/, 'PIN deve conter apenas números');

const phoneSchema = z.string()
  .regex(/^\d{10,11}$/, 'Telefone inválido');
```

### Nunca:
- ❌ Armazenar PIN localmente
- ❌ Logar PIN no console
- ❌ Passar PIN em URLs
- ❌ Mostrar PIN em texto plano

---

## 📱 Responsividade

Todos os componentes devem ser responsivos:

```tsx
{/* Tamanhos de texto */}
className="text-base sm:text-lg md:text-xl lg:text-2xl"

{/* Padding */}
className="p-3 sm:p-4 md:p-6 lg:p-8"

{/* Grid */}
className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
```

Breakpoints Tailwind:
- `sm:` 640px
- `md:` 768px
- `lg:` 1024px
- `xl:` 1280px

---

## 🧪 Testes

### Checklist de Testes

Antes de marcar uma tela como concluída:

- [ ] Visual match com design system
- [ ] Funciona em mobile (320px)
- [ ] Funciona em tablet (768px)
- [ ] Funciona em desktop (1920px)
- [ ] Animações suaves (sem lag)
- [ ] Hover states funcionando
- [ ] Active/pressed states
- [ ] Loading states
- [ ] Error states
- [ ] Teclado físico funciona (se aplicável)
- [ ] Contraste adequado (4.5:1 mínimo)
- [ ] Touch targets mínimo 44x44px

---

## 📞 Suporte

### Dúvidas sobre:

**Design:** Consulte `TOTEM_DESIGN_SYSTEM.md`  
**Implementação:** Consulte `TOTEM_COMPONENTS_USAGE.md`  
**Teclado/PIN:** Consulte `TOTEM_KEYPAD_PATTERN.md`  
**Progresso:** Consulte `TOTEM_IMPLEMENTATION_CHECKLIST.md`

---

## 🚀 Próximos Passos

1. ✅ Documentação completa criada
2. ✅ Componentes reutilizáveis criados
3. ⏳ Refatorar telas prioritárias
4. ⏳ Implementar TotemPinKeypad em todas as telas de autenticação
5. ⏳ Criar componentes adicionais conforme necessário
6. ⏳ Validar acessibilidade
7. ⏳ Testes em dispositivos reais

---

## 📄 Arquivos Criados

### Documentação
- ✅ `docs/TOTEM_QUICK_REFERENCE.md` (Referência rápida) **NOVO**
- ✅ `docs/TOTEM_IMPLEMENTATION_RULES.md` (Regras obrigatórias) **NOVO**
- ✅ `docs/TOTEM_DESIGN_SYSTEM.md` (788 linhas)
- ✅ `docs/TOTEM_IMPLEMENTATION_CHECKLIST.md` (600+ linhas)
- ✅ `docs/TOTEM_COMPONENTS_USAGE.md` (450+ linhas)
- ✅ `docs/TOTEM_KEYPAD_PATTERN.md` (400+ linhas)
- ✅ `docs/README.md` (este arquivo)

### Componentes
- ✅ `src/components/totem/TotemCard.tsx`
- ✅ `src/components/totem/TotemLayout.tsx`
- ✅ `src/components/totem/TotemPinKeypad.tsx`

---

**Versão:** 1.0.0  
**Status:** 🟢 Documentação Completa  
**Última Atualização:** Novembro 2025

---

© 2025 Costa Urbana Barbearia - Sistema Totem
