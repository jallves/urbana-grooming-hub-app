# ⚠️ ESTRUTURA DO PAINEL DO BARBEIRO - LEIA ANTES DE EDITAR ⚠️

## IMPORTANTE: Background da Barbearia

O Painel do Barbeiro tem a **MESMA** estrutura visual do Painel do Cliente:

### 🎨 Design Obrigatório
- **Background**: Imagem da barbearia (`barbershop-background.jpg`) com overlay escuro
- **Cards**: Glassmorphism (fundo transparente com blur) via componentes `ResponsiveCard` e `StandardCard`
- **Texto**: Cores claras (text-white, text-gray-300) para contraste com o fundo escuro
- **Nunca use**: `bg-white`, `bg-background` ou qualquer fundo sólido nos componentes filhos

### 📁 Arquivos Principais (NÃO ALTERAR SEM CUIDADO)

1. **`src/components/barber/BarberLayout.tsx`**
   - Gerencia o background da barbearia
   - Contém o header e navegação (desktop, mobile, tablet)
   - Wrapper para todas as páginas do painel do barbeiro
   - **CRÍTICO**: Usa `min-h-screen` (não `h-screen`) e `overflow-x-hidden`
   - Main content usa `relative z-10 w-full pb-safe` (sem flex complexos)

2. **`src/components/barber/layouts/StandardBarberLayout.tsx`**
   - Container com padding responsivo
   - NUNCA adicione flex ou min-h-0 aqui

3. **`src/components/barber/layouts/StandardCard.tsx`**
   - Cards com glassmorphism (bg-urbana-black/40 backdrop-blur-2xl)
   - Bordas com urbana-gold

4. **`src/components/barber/layouts/ResponsiveCard.tsx`**
   - Cards responsivos com padding adaptativo

### 🔧 Páginas do Painel

Todas as páginas abaixo DEVEM usar o layout padrão:
- `src/pages/BarberDashboard.tsx`
- `src/pages/BarberAppointments.tsx`
- `src/pages/BarberCommissions.tsx`

### ✅ Estrutura de Layout CORRETA (baseada no PainelClienteLayout)

```tsx
// BarberLayout.tsx - Container principal
<div className="min-h-screen w-full overflow-x-hidden relative font-poppins">
  {/* Background fixo */}
  <div className="fixed inset-0 z-0 pointer-events-none">
    <img src={barbershopBg} className="w-full h-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/85..." />
  </div>
  
  {/* Header e Nav (sticky) */}
  <header className="sticky top-0 z-50...">...</header>
  <nav className="sticky top-[68px] z-40...">...</nav>
  
  {/* Main content - SIMPLES */}
  <main className="relative z-10 w-full pb-safe">
    {children}
  </main>
</div>

// StandardBarberLayout.tsx - Container com padding
<div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
  {children}
</div>

// Página (ex: BarberDashboard.tsx)
<BarberLayout title="Dashboard">
  <StandardBarberLayout>
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Conteúdo aqui */}
    </div>
  </StandardBarberLayout>
</BarberLayout>
```

### ❌ O QUE NUNCA FAZER

```tsx
// ❌ ERRADO - Não use h-screen no container principal
<div className="h-screen overflow-y-auto">

// ❌ ERRADO - Não use flex complexos nas páginas
<div className="flex-1 flex flex-col min-h-0">

// ❌ ERRADO - Não adicione fundos brancos
<div className="bg-white">

// ❌ ERRADO - Não sobrescreva o background do layout
<div className="bg-background">

// ❌ ERRADO - Não use cores escuras de texto
<p className="text-black">
```

### ✅ O QUE FAZER

```tsx
// ✅ CORRETO - Use min-h-screen
<div className="min-h-screen w-full overflow-x-hidden relative">

// ✅ CORRETO - Main simples
<main className="relative z-10 w-full pb-safe">

// ✅ CORRETO - Páginas com max-w e space-y
<div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6">

// ✅ CORRETO - Use cards com glassmorphism
<ResponsiveCard title="Título">

// ✅ CORRETO - Use cores claras de texto
<p className="text-white">
```

### 🐛 Problemas de Responsividade

Se o painel não estiver ocupando 100% da tela ou houver problemas de scroll:

1. **Verifique BarberLayout.tsx**:
   - Main deve ser: `className="relative z-10 w-full pb-safe"`
   - Container principal deve ser: `className="min-h-screen w-full overflow-x-hidden relative font-poppins"`

2. **Verifique StandardBarberLayout.tsx**:
   - Deve ser apenas: `className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6"`
   - SEM flex, SEM min-h-0, SEM overflow

3. **Verifique as páginas**:
   - Container da página deve ser: `className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6"`
   - SEM flex-1, SEM flex flex-col, SEM min-h-0, SEM overflow

### 📏 Diferenças entre Painel do Cliente e Painel do Barbeiro

| Aspecto | Painel Cliente | Painel Barbeiro |
|---------|----------------|-----------------|
| Background | ✅ Barbershop BG | ✅ Barbershop BG |
| Glassmorphism | ✅ PainelClienteCard | ✅ ResponsiveCard/StandardCard |
| Layout Main | `pb-safe` | `pb-safe` |
| Container Principal | `min-h-screen` | `min-h-screen` |
| Responsividade | ✅ Mobile/Tablet/Web/PWA | ✅ Mobile/Tablet/Web/PWA |

### 🔍 Debug

Se precisar debugar problemas de layout:

```javascript
// No console do navegador:
console.log('Container principal:', document.querySelector('.min-h-screen'));
console.log('Main content:', document.querySelector('main'));
console.log('Background:', document.querySelector('img[alt*="Barbearia"]'));

// Verificar scroll
document.querySelector('main').style.border = '2px solid red'; // Ver área do main
```

### 📝 Notas de Desenvolvimento

- **Cache**: O navegador pode cachear a versão antiga. Sempre force refresh (Ctrl+Shift+R)
- **Build**: Após mudanças, faça rebuild se necessário
- **Mobile/PWA**: Teste sempre em mobile e PWA para garantir que ocupa 100% da tela
- **Tablet**: Verifique orientação portrait e landscape

---

## 🚨 ATENÇÃO DESENVOLVEDORES

**Ao editar qualquer arquivo do painel do barbeiro, você DEVE:**
1. Verificar que o background da barbearia continua visível
2. Confirmar que os cards usam glassmorphism
3. Testar em desktop, mobile, tablet e PWA
4. NÃO adicionar fundos brancos ou sólidos
5. NÃO usar `h-screen` ou flex complexos
6. SEMPRE usar a estrutura simples baseada no PainelClienteLayout

**Se você precisar modificar o design visual, consulte este documento primeiro!**

**IMPORTANTE**: Este painel segue EXATAMENTE a mesma estrutura do PainelClienteLayout para garantir consistência e responsividade total.
