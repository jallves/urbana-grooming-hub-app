# 🧩 Guia de Uso dos Componentes do Totem

Este guia mostra como usar os componentes reutilizáveis do Totem para garantir consistência visual.

---

## 📦 Componentes Disponíveis

### 1. TotemLayout
Layout padrão com background, header e efeitos.

### 2. TotemCard
Card padrão com glassmorphism e variantes.

### 3. TotemGrid
Grid responsivo para organizar cards.

---

## 🎯 Exemplos de Uso

### Exemplo 1: Tela de Seleção de Serviços

```tsx
import React from 'react';
import { Scissors, Info } from 'lucide-react';
import { TotemLayout, TotemGrid } from '@/components/totem/TotemLayout';
import { 
  TotemCard, 
  TotemCardTitle, 
  TotemCardPrice, 
  TotemCardDuration,
  TotemCardFooter 
} from '@/components/totem/TotemCard';

const TotemServicos: React.FC = () => {
  const services = [
    { id: 1, nome: 'Corte + Barba', preco: 35.00, duracao: 45 },
    { id: 2, nome: 'Apenas Barba', preco: 15.00, duracao: 20 },
    { id: 3, nome: 'Corte + Barba + Bigode', preco: 45.00, duracao: 60 },
  ];

  const handleSelectService = (service: any) => {
    console.log('Serviço selecionado:', service);
  };

  return (
    <TotemLayout
      title="Escolha o Serviço"
      subtitle="Selecione o serviço desejado"
      showBackButton
      backPath="/totem/home"
    >
      <TotemGrid columns={3} gap={6}>
        {services.map((service, index) => (
          <TotemCard
            key={service.id}
            icon={Scissors}
            infoIcon={Info}
            onClick={() => handleSelectService(service)}
            animationDelay={`${index * 0.1}s`}
          >
            <TotemCardTitle className="mb-4">
              {service.nome}
            </TotemCardTitle>

            <TotemCardFooter>
              <TotemCardPrice value={service.preco} />
              <TotemCardDuration minutes={service.duracao} />
            </TotemCardFooter>
          </TotemCard>
        ))}
      </TotemGrid>
    </TotemLayout>
  );
};

export default TotemServicos;
```

---

### Exemplo 2: Tela de Seleção de Barbeiro

```tsx
import React, { useState } from 'react';
import { User } from 'lucide-react';
import { TotemLayout, TotemGrid } from '@/components/totem/TotemLayout';
import { TotemCard, TotemCardTitle, TotemCardDescription } from '@/components/totem/TotemCard';

const TotemBarbeiro: React.FC = () => {
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);

  const barbers = [
    { id: '1', nome: 'João Silva', especialidade: 'Cortes Clássicos' },
    { id: '2', nome: 'Pedro Santos', especialidade: 'Barba e Bigode' },
    { id: '3', nome: 'Carlos Lima', especialidade: 'Degradês' },
  ];

  return (
    <TotemLayout
      title="Escolha o Barbeiro"
      subtitle="Selecione seu barbeiro de preferência"
      showBackButton
    >
      <TotemGrid columns={3}>
        {barbers.map((barber, index) => (
          <TotemCard
            key={barber.id}
            icon={User}
            variant={selectedBarber === barber.id ? 'selected' : 'default'}
            onClick={() => setSelectedBarber(barber.id)}
            animationDelay={`${index * 0.1}s`}
          >
            <TotemCardTitle className="mb-2">
              {barber.nome}
            </TotemCardTitle>
            <TotemCardDescription>
              {barber.especialidade}
            </TotemCardDescription>
          </TotemCard>
        ))}
      </TotemGrid>
    </TotemLayout>
  );
};

export default TotemBarbeiro;
```

---

### Exemplo 3: Card com Estados Diferentes

```tsx
import React from 'react';
import { Clock } from 'lucide-react';
import { TotemCard, TotemCardTitle } from '@/components/totem/TotemCard';

const ExemploEstados: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Card Normal */}
      <TotemCard
        icon={Clock}
        variant="default"
        onClick={() => console.log('Normal')}
      >
        <TotemCardTitle>Card Normal</TotemCardTitle>
      </TotemCard>

      {/* Card Selecionado */}
      <TotemCard
        icon={Clock}
        variant="selected"
      >
        <TotemCardTitle>Card Selecionado</TotemCardTitle>
      </TotemCard>

      {/* Card Desabilitado */}
      <TotemCard
        icon={Clock}
        variant="disabled"
        disabled
      >
        <TotemCardTitle>Card Desabilitado</TotemCardTitle>
      </TotemCard>

      {/* Card de Sucesso */}
      <TotemCard
        icon={Clock}
        variant="success"
      >
        <TotemCardTitle>Card de Sucesso</TotemCardTitle>
      </TotemCard>

      {/* Card de Erro */}
      <TotemCard
        icon={Clock}
        variant="error"
      >
        <TotemCardTitle>Card de Erro</TotemCardTitle>
      </TotemCard>
    </div>
  );
};
```

---

### Exemplo 4: Grid Customizado

```tsx
import React from 'react';
import { TotemLayout, TotemContentContainer, TotemGrid } from '@/components/totem/TotemLayout';
import { TotemCard } from '@/components/totem/TotemCard';

const ExemploGrid: React.FC = () => {
  return (
    <TotemLayout title="Diferentes Grids">
      <TotemContentContainer maxWidth="7xl">
        {/* Grid de 2 colunas */}
        <h2 className="text-2xl text-urbana-light mb-4">Grid 2 Colunas</h2>
        <TotemGrid columns={2} gap={4}>
          <TotemCard>Card 1</TotemCard>
          <TotemCard>Card 2</TotemCard>
        </TotemGrid>

        {/* Grid de 3 colunas */}
        <h2 className="text-2xl text-urbana-light mb-4 mt-8">Grid 3 Colunas</h2>
        <TotemGrid columns={3} gap={6}>
          <TotemCard>Card 1</TotemCard>
          <TotemCard>Card 2</TotemCard>
          <TotemCard>Card 3</TotemCard>
        </TotemGrid>

        {/* Grid de 4 colunas */}
        <h2 className="text-2xl text-urbana-light mb-4 mt-8">Grid 4 Colunas</h2>
        <TotemGrid columns={4} gap={4}>
          <TotemCard>Card 1</TotemCard>
          <TotemCard>Card 2</TotemCard>
          <TotemCard>Card 3</TotemCard>
          <TotemCard>Card 4</TotemCard>
        </TotemGrid>
      </TotemContentContainer>
    </TotemLayout>
  );
};
```

---

## 📋 Props dos Componentes

### TotemLayout Props
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| children | ReactNode | - | Conteúdo da tela |
| title | string | - | Título da tela |
| subtitle | string | - | Subtítulo da tela |
| showBackButton | boolean | false | Mostrar botão voltar |
| onBack | () => void | - | Callback ao clicar em voltar |
| backPath | string | - | Caminho para voltar |
| headerRight | ReactNode | - | Conteúdo à direita do header |
| className | string | - | Classes CSS adicionais |

### TotemCard Props
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| children | ReactNode | - | Conteúdo do card |
| onClick | () => void | - | Callback ao clicar |
| variant | 'default' \| 'selected' \| 'disabled' \| 'success' \| 'error' | 'default' | Variante visual |
| icon | LucideIcon | - | Ícone principal |
| infoIcon | LucideIcon | - | Ícone de informação |
| onInfoClick | () => void | - | Callback ao clicar no ícone de info |
| className | string | - | Classes CSS adicionais |
| animationDelay | string | '0s' | Delay da animação |
| disabled | boolean | false | Desabilita o card |

### TotemGrid Props
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| children | ReactNode | - | Cards filho |
| columns | 1 \| 2 \| 3 \| 4 | 3 | Número de colunas |
| gap | 2 \| 3 \| 4 \| 6 \| 8 | 4 | Espaçamento entre cards |
| className | string | - | Classes CSS adicionais |

---

## 🎨 Variantes de Card

### default
Card padrão com borda dourada, interativo.

### selected
Card com borda dourada intensa e ring, indicando seleção.

### disabled
Card com borda vermelha e opacidade reduzida, não interativo.

### success
Card com borda verde, indicando sucesso.

### error
Card com borda vermelha, indicando erro.

---

## 💡 Dicas de Uso

1. **Use TotemLayout em todas as telas** para consistência
2. **TotemCard para todos os elementos clicáveis** (serviços, barbeiros, horários)
3. **TotemGrid para organizar múltiplos cards** de forma responsiva
4. **Adicione animationDelay** para efeito sequencial em listas
5. **Use os sub-componentes** (TotemCardTitle, TotemCardPrice, etc) para manter hierarquia

---

## 🚀 Próximos Passos

1. Refatorar todas as telas do Totem para usar esses componentes
2. Criar mais componentes reutilizáveis conforme necessário
3. Documentar novos padrões descobertos

---

**Versão:** 1.0.0  
**Status:** 🟢 Ativo
