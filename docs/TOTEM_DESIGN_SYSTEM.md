# 🎨 Sistema de Design do Totem Costa Urbana

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Padrão de Cards](#padrão-de-cards)
3. [Componentes Base](#componentes-base)
4. [Cores e Tokens](#cores-e-tokens)
5. [Tipografia](#tipografia)
6. [Animações](#animações)
7. [Checklist de Implementação](#checklist-de-implementação)

---

## 🎯 Visão Geral

Este documento define o padrão visual e de interação para **todas** as telas, componentes e formulários do Totem de autoatendimento da Costa Urbana. O objetivo é garantir uma experiência consistente, elegante e premium em toda a jornada do cliente.

### Princípios de Design
- ✨ **Glassmorphism**: Transparência elegante com blur
- 🎨 **Hierarquia Visual Clara**: Dourado para elementos importantes
- 🖼️ **Background com Profundidade**: Imagem de barbearia com overlays
- 🎭 **Animações Suaves**: Transições que agregam qualidade
- 📱 **Responsivo**: Adaptável a diferentes tamanhos de tela

---

## 🎴 Padrão de Cards

### Card Padrão Glassmorphism

```tsx
<Card className="
  bg-white/5 
  backdrop-blur-2xl 
  border-2 
  border-urbana-gold/40 
  rounded-2xl 
  shadow-[0_8px_32px_rgba(0,0,0,0.4)]
  transition-all 
  duration-300
  hover:border-urbana-gold/60
  hover:shadow-[0_12px_40px_rgba(212,175,55,0.2)]
  active:scale-98
">
  {/* Conteúdo do card */}
</Card>
```

### Estrutura Interna do Card

```tsx
<Card className="bg-white/5 backdrop-blur-2xl border-2 border-urbana-gold/40 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-6">
  {/* Header: Ícones e Badge */}
  <div className="flex items-center justify-between mb-4">
    {/* Ícone Principal */}
    <div className="w-12 h-12 rounded-full bg-urbana-gold/20 backdrop-blur-sm border-2 border-urbana-gold/50 flex items-center justify-center">
      <Scissors className="w-6 h-6 text-urbana-gold drop-shadow-lg" />
    </div>
    
    {/* Ícone de Informação (opcional) */}
    <div className="w-8 h-8 rounded-full bg-urbana-gold/10 flex items-center justify-center">
      <Info className="w-4 h-4 text-urbana-gold/60" />
    </div>
  </div>

  {/* Título */}
  <h3 className="text-xl font-bold text-white drop-shadow-lg mb-2">
    Nome do Serviço
  </h3>

  {/* Informações Secundárias */}
  <div className="flex items-center justify-between">
    <p className="text-2xl font-bold text-urbana-gold drop-shadow-lg">
      R$ 35,00
    </p>
    <p className="text-sm text-white/60">
      45 min
    </p>
  </div>
</Card>
```

---

## 🧩 Componentes Base

### 1. Container Principal

```tsx
<div className="fixed inset-0 w-screen h-screen flex flex-col p-3 sm:p-4 md:p-6 lg:p-8 font-poppins relative overflow-hidden">
  {/* Background image */}
  <div className="absolute inset-0 z-0">
    <img 
      src={barbershopBg} 
      alt="Barbearia" 
      className="w-full h-full object-cover"
    />
    {/* Dark overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/85 via-urbana-black/80 to-urbana-brown/75" />
  </div>

  {/* Animated background effects */}
  <div className="absolute inset-0 overflow-hidden z-0">
    <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse-slow" />
    <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-urbana-gold-vibrant/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
  </div>

  {/* Conteúdo (z-10) */}
  <div className="relative z-10">
    {/* Seu conteúdo aqui */}
  </div>
</div>
```

### 2. Header Padrão

```tsx
<div className="flex items-center justify-between mb-4 sm:mb-6 z-10">
  {/* Botão Voltar */}
  <Button
    variant="ghost"
    size="lg"
    className="h-12 md:h-14 px-4 md:px-6 text-base md:text-lg text-urbana-light hover:text-urbana-gold hover:bg-urbana-gold/10"
  >
    <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 mr-2" />
    Voltar
  </Button>

  {/* Título Centralizado */}
  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-urbana-light text-center flex-1">
    Título da Tela
  </h1>

  {/* Espaçador */}
  <div className="w-24 md:w-32" />
</div>
```

### 3. Grid de Cards

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
  {items.map((item) => (
    <Card
      key={item.id}
      onClick={() => handleSelect(item)}
      className="
        bg-white/5 
        backdrop-blur-2xl 
        border-2 
        border-urbana-gold/40 
        rounded-2xl 
        shadow-[0_8px_32px_rgba(0,0,0,0.4)]
        cursor-pointer
        transition-all 
        duration-200
        hover:border-urbana-gold/60
        hover:shadow-[0_12px_40px_rgba(212,175,55,0.3)]
        hover:scale-[1.02]
        active:scale-98
        p-6
      "
    >
      {/* Conteúdo do card */}
    </Card>
  ))}
</div>
```

### 4. Botões de Ação

```tsx
{/* Botão Primário */}
<Button className="
  w-full 
  h-14 sm:h-16 md:h-20 
  text-lg sm:text-xl md:text-2xl 
  font-bold 
  bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold 
  hover:from-yellow-500 hover:via-urbana-gold hover:to-yellow-500 
  text-urbana-black 
  shadow-[0_8px_24px_rgba(212,175,55,0.4)] 
  hover:shadow-[0_12px_32px_rgba(212,175,55,0.6)] 
  transition-all 
  duration-300 
  hover:scale-105
  active:scale-95
  border-2 
  border-yellow-400/30
">
  Confirmar
</Button>

{/* Botão Secundário */}
<Button 
  variant="outline"
  className="
    w-full 
    h-14 sm:h-16 
    text-lg sm:text-xl 
    border-2 
    border-urbana-gold/40 
    bg-white/5 
    backdrop-blur-sm 
    text-urbana-light 
    hover:bg-white/10 
    hover:border-urbana-gold/60 
    transition-all 
    duration-300
  "
>
  Cancelar
</Button>
```

### 5. Estados de Cards

```tsx
{/* Card Normal - Disponível */}
<Card className="
  bg-white/5 
  backdrop-blur-2xl 
  border-2 
  border-urbana-gold/40
  cursor-pointer
  hover:border-urbana-gold/60
  hover:shadow-[0_12px_40px_rgba(212,175,55,0.3)]
">

{/* Card Selecionado */}
<Card className="
  bg-white/5 
  backdrop-blur-2xl 
  border-2 
  border-urbana-gold 
  shadow-[0_12px_40px_rgba(212,175,55,0.4)]
  ring-4 
  ring-urbana-gold/20
">

{/* Card Desabilitado */}
<Card className="
  bg-white/5 
  backdrop-blur-2xl 
  border-2 
  border-red-500/30 
  opacity-75 
  cursor-not-allowed
">

{/* Card Concluído/Sucesso */}
<Card className="
  bg-white/5 
  backdrop-blur-2xl 
  border-2 
  border-green-500/50 
  shadow-[0_8px_32px_rgba(16,185,129,0.2)]
">
```

---

## 🎨 Cores e Tokens

### Paleta Principal
```css
/* Dourado - Identidade da marca */
--urbana-gold: hsl(43, 74%, 49%)           /* #D4AF37 */
--urbana-gold-light: hsl(48, 89%, 60%)     /* Mais claro */
--urbana-gold-vibrant: hsl(45, 100%, 51%)  /* Vibrante */

/* Preto/Escuro - Background */
--urbana-black: hsl(0, 0%, 7%)             /* #121212 */
--urbana-black-soft: hsl(30, 10%, 15%)     /* Com tom marrom */

/* Branco/Claro - Texto */
--urbana-light: hsl(0, 0%, 95%)            /* #F2F2F2 */

/* Marrom - Acento */
--urbana-brown: hsl(30, 25%, 25%)          /* Tom terroso */
```

### Transparências Padrão
```css
/* Cards */
bg-white/5          /* Background principal dos cards */
bg-urbana-gold/10   /* Background de ícones */
bg-urbana-gold/20   /* Background hover */

/* Bordas */
border-urbana-gold/30   /* Borda suave */
border-urbana-gold/40   /* Borda padrão */
border-urbana-gold/50   /* Borda ativa */
border-urbana-gold/60   /* Borda hover */

/* Sombras */
shadow-[0_8px_32px_rgba(0,0,0,0.4)]                  /* Sombra padrão */
shadow-[0_12px_40px_rgba(212,175,55,0.3)]            /* Sombra hover dourada */
shadow-[0_0_40px_rgba(212,175,55,0.2)]               /* Glow dourado */
```

---

## 📝 Tipografia

### Hierarquia de Textos

```tsx
{/* Título Principal (H1) */}
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-urbana-light drop-shadow-lg">
  Título Principal
</h1>

{/* Título Secundário (H2) */}
<h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-urbana-light">
  Título Secundário
</h2>

{/* Título de Card (H3) */}
<h3 className="text-lg sm:text-xl font-bold text-urbana-light">
  Título do Card
</h3>

{/* Texto Destacado - Preço */}
<p className="text-2xl sm:text-3xl font-bold text-urbana-gold drop-shadow-lg">
  R$ 35,00
</p>

{/* Texto Normal */}
<p className="text-base sm:text-lg text-urbana-light">
  Texto descritivo
</p>

{/* Texto Secundário */}
<p className="text-sm sm:text-base text-urbana-light/60">
  Informação adicional
</p>

{/* Texto Pequeno */}
<p className="text-xs sm:text-sm text-urbana-light/40">
  Legenda ou ajuda
</p>
```

### Text Shadows para Legibilidade

```tsx
{/* Texto sobre backgrounds escuros/imagens */}
className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"

{/* Texto com destaque dourado */}
style={{ textShadow: '0 0 40px rgba(212, 175, 55, 0.3), 0 4px 20px rgba(0, 0, 0, 0.8)' }}

{/* Texto de sucesso */}
style={{ textShadow: '0 0 40px rgba(16, 185, 129, 0.3), 0 4px 20px rgba(0, 0, 0, 0.8)' }}
```

---

## 🎬 Animações

### Animações de Entrada

```tsx
{/* Fade In */}
<div className="animate-fade-in">
  {/* Conteúdo */}
</div>

{/* Scale In */}
<div className="animate-scale-in">
  {/* Conteúdo */}
</div>

{/* Com delay sequencial */}
<div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
  {/* Aparece primeiro */}
</div>
<div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
  {/* Aparece depois */}
</div>
```

### Animações de Interação

```tsx
{/* Hover Scale */}
<div className="transition-all duration-300 hover:scale-105 active:scale-95">
  {/* Conteúdo */}
</div>

{/* Pulse (para elementos de atenção) */}
<div className="animate-pulse-slow">
  {/* Elemento pulsante */}
</div>

{/* Glow pulsante em backgrounds */}
<div className="absolute ... bg-urbana-gold/10 rounded-full blur-3xl animate-pulse-slow" />
```

---

## ✅ Checklist de Implementação

### Para CADA tela/componente do Totem:

#### 1. Background e Container
- [ ] Background com imagem de barbearia
- [ ] Overlay escuro com gradiente (`from-urbana-black/85 via-urbana-black/80 to-urbana-brown/75`)
- [ ] Efeitos de glow animados (2 círculos blur com `animate-pulse-slow`)
- [ ] Container com `fixed inset-0 w-screen h-screen`
- [ ] Padding responsivo: `p-3 sm:p-4 md:p-6 lg:p-8`
- [ ] Font: `font-poppins`

#### 2. Cards
- [ ] Background: `bg-white/5 backdrop-blur-2xl`
- [ ] Borda: `border-2 border-urbana-gold/40`
- [ ] Border radius: `rounded-2xl`
- [ ] Shadow: `shadow-[0_8px_32px_rgba(0,0,0,0.4)]`
- [ ] Padding interno: `p-4 sm:p-6 md:p-8` (responsivo)
- [ ] Ícone no canto superior esquerdo com fundo circular dourado
- [ ] Estados hover/active configurados
- [ ] Animação de entrada

#### 3. Ícones
- [ ] Ícones principais: `w-6 h-6 text-urbana-gold`
- [ ] Container de ícone: `w-12 h-12 rounded-full bg-urbana-gold/20 backdrop-blur-sm border-2 border-urbana-gold/50`
- [ ] Drop shadow nos ícones: `drop-shadow-lg`

#### 4. Tipografia
- [ ] Títulos em `text-urbana-light` (branco)
- [ ] Preços/valores em `text-urbana-gold` (dourado)
- [ ] Informações secundárias em `text-urbana-light/60`
- [ ] Tamanhos responsivos (sm: md: lg: xl:)
- [ ] Drop shadows em textos sobre backgrounds escuros

#### 5. Botões
- [ ] Botão primário com gradiente dourado
- [ ] Botão secundário com borda e background transparente
- [ ] Tamanhos responsivos: `h-14 sm:h-16 md:h-20`
- [ ] Efeitos hover e active (scale)
- [ ] Sombras apropriadas

#### 6. Estados e Feedback
- [ ] Estado normal (disponível)
- [ ] Estado hover
- [ ] Estado ativo/selecionado
- [ ] Estado desabilitado
- [ ] Estado de sucesso (verde)
- [ ] Estado de erro (vermelho)
- [ ] Loading states

#### 7. Responsividade
- [ ] Mobile: Texto menor, padding menor
- [ ] Tablet: Tamanhos intermediários
- [ ] Desktop: Texto maior, espaçamentos generosos
- [ ] Grid adaptável: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

#### 8. Acessibilidade
- [ ] Contraste adequado de texto
- [ ] Áreas de toque mínimas (44x44px)
- [ ] Estados visuais claros
- [ ] Feedback visual em interações

---

## 📁 Arquivos Afetados

### Páginas do Totem (`src/pages/Totem/`)
- [ ] `TotemHome.tsx`
- [ ] `TotemLogin.tsx`
- [ ] `TotemWelcome.tsx`
- [ ] `TotemSearch.tsx`
- [ ] `TotemAppointmentsList.tsx`
- [ ] `TotemConfirmation.tsx`
- [ ] `TotemCheckInSuccess.tsx`
- [ ] `TotemRating.tsx`
- [ ] `TotemAgendamentoSucesso.tsx`
- [ ] `TotemServico.tsx`
- [ ] `TotemBarbeiro.tsx`
- [ ] `TotemDataHora.tsx`
- [ ] E todas as outras páginas relacionadas

### Componentes do Totem (`src/components/totem/`)
- [ ] `ExpressCheckIn.tsx`
- [ ] `NewFeaturesModal.tsx`
- [ ] `TotemNumericKeypad.tsx`
- [ ] E todos os outros componentes

---

## 🎯 Exemplo Completo: Tela de Seleção de Serviços

```tsx
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Scissors, Clock, DollarSign, Info, ArrowLeft } from 'lucide-react';
import barbershopBg from '@/assets/barbershop-background.jpg';

const TotemServicos: React.FC = () => {
  const services = [
    { id: 1, nome: 'Corte + Barba', preco: 35.00, duracao: 45 },
    { id: 2, nome: 'Apenas Barba', preco: 15.00, duracao: 20 },
    // ...
  ];

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col p-3 sm:p-4 md:p-6 lg:p-8 font-poppins relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={barbershopBg} 
          alt="Barbearia" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/85 via-urbana-black/80 to-urbana-brown/75" />
      </div>

      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-urbana-gold-vibrant/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-4 sm:mb-6">
        <Button
          variant="ghost"
          size="lg"
          className="h-12 md:h-14 px-4 md:px-6 text-base md:text-lg text-urbana-light hover:text-urbana-gold hover:bg-urbana-gold/10"
        >
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 mr-2" />
          Voltar
        </Button>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-urbana-light text-center flex-1 drop-shadow-lg">
          Escolha o Serviço
        </h1>

        <div className="w-24 md:w-32" />
      </div>

      {/* Subtitle */}
      <p className="relative z-10 text-center text-base sm:text-lg text-urbana-light/70 mb-6 sm:mb-8">
        Selecione o serviço desejado
      </p>

      {/* Services Grid */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-7xl mx-auto pb-4">
          {services.map((service, index) => (
            <Card
              key={service.id}
              onClick={() => handleSelectService(service)}
              className="
                bg-white/5 
                backdrop-blur-2xl 
                border-2 
                border-urbana-gold/40 
                rounded-2xl 
                shadow-[0_8px_32px_rgba(0,0,0,0.4)]
                p-6
                cursor-pointer
                transition-all 
                duration-300
                hover:border-urbana-gold/60
                hover:shadow-[0_12px_40px_rgba(212,175,55,0.3)]
                hover:scale-[1.02]
                active:scale-98
                animate-scale-in
              "
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Header: Ícones */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-urbana-gold/20 backdrop-blur-sm border-2 border-urbana-gold/50 flex items-center justify-center shadow-lg shadow-urbana-gold/20">
                  <Scissors className="w-6 h-6 text-urbana-gold drop-shadow-lg" />
                </div>
                
                <div className="w-8 h-8 rounded-full bg-urbana-gold/10 flex items-center justify-center">
                  <Info className="w-4 h-4 text-urbana-gold/60" />
                </div>
              </div>

              {/* Nome do Serviço */}
              <h3 className="text-xl font-bold text-white drop-shadow-lg mb-4">
                {service.nome}
              </h3>

              {/* Preço e Duração */}
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-urbana-gold drop-shadow-lg">
                  R$ {service.preco.toFixed(2)}
                </p>
                <p className="text-sm text-white/60">
                  {service.duracao} min
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TotemServicos;
```

---

## 🚀 Próximos Passos

1. **Auditar todas as telas do Totem** e aplicar os padrões definidos
2. **Criar componentes reutilizáveis** (TotemCard, TotemButton, TotemHeader)
3. **Testar responsividade** em diferentes dispositivos
4. **Validar acessibilidade** e contraste
5. **Documentar exceções** (se houver casos específicos)

---

## 📞 Contato

Para dúvidas ou sugestões sobre este sistema de design, entre em contato com a equipe de desenvolvimento.

**Versão:** 1.0.0  
**Última atualização:** Novembro 2025  
**Status:** 🟢 Ativo
