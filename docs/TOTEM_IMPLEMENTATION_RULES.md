# 🎯 Regras de Implementação - Totem Costa Urbana

## 🔒 Regras OBRIGATÓRIAS

### 1. Componente de Teclado (CRÍTICO)

**REGRA:** Existe APENAS UM componente de teclado no sistema: `TotemPinKeypad`

```tsx
// ✅ SEMPRE assim
import { TotemPinKeypad } from '@/components/totem/TotemPinKeypad';

// ❌ NUNCA assim
import { CustomKeypad } from '...';
import { NumericKeypad } from '...';
<input type="tel" />
<input type="number" />
```

### 2. Design System

**REGRA:** Use SEMPRE os tokens do design system

```tsx
// ✅ CORRETO - Usar tokens semânticos
className="bg-urbana-black text-urbana-light border-urbana-gold"

// ❌ ERRADO - Cores diretas
className="bg-black text-white border-yellow-500"
```

### 3. Estrutura de Layout

**REGRA:** Todas as telas do totem devem seguir a mesma estrutura

```tsx
<div className="fixed inset-0 w-screen h-screen">
  {/* Background */}
  <div className="absolute inset-0">
    <img src={barbershopBg} className="w-full h-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/85..." />
  </div>
  
  {/* Effects */}
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-urbana-gold/10 rounded-full blur-3xl..." />
  </div>
  
  {/* Content */}
  <div className="relative z-10">
    {/* Seu conteúdo aqui */}
  </div>
</div>
```

### 4. Cards Glassmorphism

**REGRA:** Usar sempre o padrão de glassmorphism para cards

```tsx
// ✅ CORRETO
<Card className="bg-urbana-black/40 backdrop-blur-md border-2 border-urbana-gold/30 rounded-2xl shadow-2xl" />

// ❌ ERRADO
<div className="bg-white rounded shadow" />
```

### 5. Navegação

**REGRA:** Sempre incluir botão de voltar no canto superior esquerdo

```tsx
<button
  onClick={() => navigate(-1)}
  className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-urbana-black/60 backdrop-blur-sm border-2 border-urbana-gold/50 rounded-xl text-urbana-light hover:bg-urbana-gold/20 transition-all"
>
  <ChevronLeft className="w-5 h-5" />
  <span className="font-semibold">Voltar</span>
</button>
```

## 🎨 Padrões Visuais

### Tipografia

```tsx
// Títulos principais
<h1 className="text-3xl md:text-4xl font-bold text-urbana-light" />

// Subtítulos
<p className="text-lg text-urbana-light/70" />

// Badges/Tags
<span className="text-xs font-bold text-urbana-gold uppercase tracking-wider" />
```

### Botões

```tsx
// Primário (Dourado)
<Button className="bg-gradient-to-r from-urbana-gold to-urbana-gold-light text-urbana-black font-bold" />

// Secundário (Outline)
<Button variant="outline" className="border-2 border-urbana-gold text-urbana-gold hover:bg-urbana-gold/20" />

// Fantasma
<Button variant="ghost" className="text-urbana-light hover:bg-urbana-gold/10" />
```

### Animações

```tsx
// Fade in
className="animate-fade-in"

// Scale in
className="animate-scale-in"

// Com delay
className="animate-fade-in" style={{ animationDelay: '0.2s' }}
```

## 🚫 O Que NUNCA Fazer

1. ❌ Criar novos componentes de teclado
2. ❌ Usar cores diretas (white, black, yellow, etc)
3. ❌ Ignorar o design system
4. ❌ Copiar código ao invés de usar componentes
5. ❌ Esquecer animações e transições
6. ❌ Não testar responsividade
7. ❌ Esquecer estados de loading
8. ❌ Não adicionar feedback visual (toasts, etc)

## ✅ Checklist Antes de Commit

- [ ] Usei `TotemPinKeypad` para entrada de dados?
- [ ] Segui o design system (tokens semânticos)?
- [ ] Adicionei animações?
- [ ] Testei em diferentes tamanhos de tela?
- [ ] Adicionei estados de loading?
- [ ] Implementei feedback visual (toasts)?
- [ ] Código está organizado e limpo?
- [ ] Consultei a documentação?

## 📁 Estrutura de Arquivos

```
src/pages/Totem/
  ├── TotemLogin.tsx          ← Usa TotemPinKeypad (PIN)
  ├── TotemSearch.tsx         ← Usa TotemPinKeypad (Phone)
  ├── TotemCheckoutSearch.tsx ← Usa TotemPinKeypad (Phone)
  └── ...

src/components/totem/
  ├── TotemPinKeypad.tsx      ← ÚNICO componente de teclado
  ├── TotemCard.tsx           ← Cards glassmorphism
  ├── TotemGrid.tsx           ← Grid responsivo
  └── TotemLayout.tsx         ← Layout padrão
```

## 🆘 Dúvidas?

1. Consulte `TOTEM_QUICK_REFERENCE.md`
2. Veja exemplos em `TotemLogin.tsx`
3. Leia `TOTEM_KEYPAD_PATTERN.md`
4. Revise `TOTEM_DESIGN_SYSTEM.md`

---

**⚠️ LEMBRE-SE:** Consistência é fundamental. Siga SEMPRE estes padrões para garantir uma experiência premium e profissional.
