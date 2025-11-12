# Sistema de Design - Painel do Cliente

## 🎨 Visão Geral

O Painel do Cliente segue o mesmo design system do Totem, proporcionando uma experiência visual consistente e premium em toda a aplicação da Urbana Barbearia.

## 🏗️ Estrutura Base

### PainelClienteLayout

O layout base para todas as telas do painel do cliente, incluindo:

- **Background**: Imagem da barbearia (`barbershop-background.jpg`)
- **Overlay escuro**: Gradiente de `urbana-black` com `urbana-brown`
- **Efeitos animados**: Círculos brilhantes em `urbana-gold`
- **Header**: Barra superior com logo, notificações e logout
- **Navegação mobile**: Tabs na parte inferior para telas pequenas

```tsx
import { PainelClienteLayout } from '@/components/painel-cliente/PainelClienteLayout';

// O layout já está configurado nas rotas, então basta usar o Outlet
```

### PainelClienteContentContainer

Container responsivo para conteúdo com controle de largura máxima:

```tsx
import { PainelClienteContentContainer } from '@/components/painel-cliente/PainelClienteContentContainer';

<PainelClienteContentContainer maxWidth="5xl">
  {/* Conteúdo aqui */}
</PainelClienteContentContainer>
```

**Opções de maxWidth:**
- `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl`, `5xl`, `6xl`, `7xl` (padrão)

## 🎴 Componentes de Card

### PainelClienteCard

Card com efeito glassmorphism, disponível em 5 variantes:

**Variantes:**
- `default` - Padrão, bordas sutis
- `highlight` - Destaque com dourado (`urbana-gold`)
- `success` - Verde para sucesso
- `warning` - Amarelo para avisos
- `info` - Azul para informações

```tsx
import { 
  PainelClienteCard,
  PainelClienteCardHeader,
  PainelClienteCardTitle,
  PainelClienteCardDescription,
  PainelClienteCardContent,
  PainelClienteCardFooter 
} from '@/components/painel-cliente/PainelClienteCard';

<PainelClienteCard
  variant="highlight"
  icon={Calendar}
  onClick={() => navigate('/agendar')}
>
  <PainelClienteCardHeader>
    <PainelClienteCardTitle>Agendar Horário</PainelClienteCardTitle>
    <PainelClienteCardDescription>
      Escolha data e horário
    </PainelClienteCardDescription>
  </PainelClienteCardHeader>
  
  <PainelClienteCardContent>
    {/* Conteúdo do card */}
  </PainelClienteCardContent>
  
  <PainelClienteCardFooter>
    {/* Footer opcional */}
  </PainelClienteCardFooter>
</PainelClienteCard>
```

## 🎨 Cores e Tokens

O sistema usa as cores definidas no Tailwind config:

### Cores Principais
- `urbana-gold` - Dourado principal (#D4AF37)
- `urbana-gold-vibrant` - Dourado vibrante (#FFD700)
- `urbana-black` - Preto principal (#0A0A0A)
- `urbana-brown` - Marrom (#4A2C2A)
- `urbana-light` - Texto claro (#F8F8F8)

### Uso nos Cards
```tsx
// Backgrounds
bg-urbana-black/20        // Fundo semi-transparente
backdrop-blur-md          // Efeito de blur

// Bordas
border-urbana-gold/30     // Borda dourada transparente
border-urbana-light/20    // Borda clara transparente

// Sombras
shadow-lg shadow-urbana-gold/10    // Sombra dourada
shadow-xl shadow-urbana-gold/20    // Sombra dourada mais intensa

// Hover states
hover:border-urbana-gold/50        // Borda mais visível no hover
hover:bg-urbana-gold/10            // Background no hover
hover:scale-[1.02]                 // Escala sutil no hover
active:scale-[0.98]                // Escala ao clicar
```

## 📐 Estrutura Glassmorphism

Todos os cards seguem este padrão:

```css
/* Background semi-transparente */
background: rgba(10, 10, 10, 0.2);  /* urbana-black/20 */

/* Blur no backdrop */
backdrop-filter: blur(12px);

/* Borda sutil */
border: 1px solid rgba(212, 175, 55, 0.3);  /* urbana-gold/30 */

/* Sombra com a cor da variante */
box-shadow: 0 10px 15px -3px rgba(212, 175, 55, 0.1);

/* Transições suaves */
transition: all 300ms ease-in-out;
```

## 🎭 Estados Interativos

### Hover
- Aumenta opacidade da borda
- Adiciona background colorido sutil
- Aumenta sombra
- Escala levemente (1.02x)

### Active (Click)
- Reduz escala (0.98x)
- Mantém cores intensas

### Disabled
- `opacity-50`
- `cursor-not-allowed`
- Remove interações

## 📱 Responsividade

O sistema é mobile-first com breakpoints:

```tsx
// Texto responsivo
className="text-sm sm:text-base md:text-lg lg:text-xl"

// Grid responsivo
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"

// Padding responsivo
className="p-3 sm:p-4 md:p-6 lg:p-8"
```

## ✨ Animações

### Entrada (via Framer Motion)
```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 }
  }
};
```

### Background Animado
Os círculos brilhantes no fundo têm:
- `animate-pulse-slow` (duração customizada)
- Atraso escalonado para movimento orgânico

## 📋 Exemplo Completo

```tsx
import React from 'react';
import { Calendar, Clock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PainelClienteContentContainer } from '@/components/painel-cliente/PainelClienteContentContainer';
import { 
  PainelClienteCard,
  PainelClienteCardHeader,
  PainelClienteCardTitle,
  PainelClienteCardContent 
} from '@/components/painel-cliente/PainelClienteCard';

export default function ExamplePage() {
  const navigate = useNavigate();

  return (
    <PainelClienteContentContainer maxWidth="5xl">
      <h1 className="text-3xl font-bold text-urbana-gold mb-6 drop-shadow-lg">
        Minha Página
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PainelClienteCard
          variant="highlight"
          icon={Calendar}
          onClick={() => navigate('/agendar')}
        >
          <PainelClienteCardHeader>
            <PainelClienteCardTitle>
              Novo Agendamento
            </PainelClienteCardTitle>
          </PainelClienteCardHeader>
          <PainelClienteCardContent>
            <p className="text-urbana-light/70">
              Agende seu próximo atendimento
            </p>
          </PainelClienteCardContent>
        </PainelClienteCard>

        <PainelClienteCard variant="info" icon={Clock}>
          <PainelClienteCardHeader>
            <PainelClienteCardTitle>
              Histórico
            </PainelClienteCardTitle>
          </PainelClienteCardHeader>
          <PainelClienteCardContent>
            <p className="text-urbana-light/70">
              Veja seus agendamentos
            </p>
          </PainelClienteCardContent>
        </PainelClienteCard>
      </div>
    </PainelClienteContentContainer>
  );
}
```

## 🔄 Consistência com o Totem

O Painel do Cliente usa exatamente:
- ✅ Mesma imagem de background
- ✅ Mesmo overlay escuro com gradiente
- ✅ Mesmos efeitos animados de círculos brilhantes
- ✅ Mesma paleta de cores (tokens do Tailwind)
- ✅ Mesmo padrão de glassmorphism nos cards
- ✅ Mesmas transições e animações

## 📁 Arquivos Relacionados

- `src/components/painel-cliente/PainelClienteLayout.tsx` - Layout principal
- `src/components/painel-cliente/PainelClienteCard.tsx` - Componentes de card
- `src/components/painel-cliente/PainelClienteContentContainer.tsx` - Container de conteúdo
- `src/components/totem/TotemLayout.tsx` - Referência do design original
- `src/assets/barbershop-background.jpg` - Imagem de fundo
- `tailwind.config.ts` - Definições de cores
- `src/index.css` - Estilos globais e animações

## 🎯 Boas Práticas

1. **Sempre use os componentes PainelClienteCard** ao invés de Card genérico
2. **Use PainelClienteContentContainer** para envolver o conteúdo da página
3. **Prefira tokens de cor** (`urbana-gold`) ao invés de valores diretos
4. **Use variantes apropriadas** para comunicar estado/importância
5. **Mantenha a hierarquia de texto** com classes de tamanho responsivo
6. **Adicione ícones** para melhor comunicação visual
7. **Use drop-shadow-lg** em títulos principais para legibilidade

## 🚀 Próximos Passos

Ao adicionar novas páginas ao Painel do Cliente:

1. Importar `PainelClienteContentContainer`
2. Importar componentes `PainelClienteCard*`
3. Seguir a estrutura de exemplo acima
4. Usar variantes de card apropriadas
5. Manter consistência visual com outras páginas
6. Testar responsividade em diferentes tamanhos de tela
