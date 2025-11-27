# ⚠️ ESTRUTURA DO PAINEL DO BARBEIRO - LEIA ANTES DE EDITAR ⚠️

## IMPORTANTE: Background da Barbearia

O Painel do Barbeiro tem uma estrutura visual **IDÊNTICA** ao Painel do Cliente que **NUNCA** deve ser alterada:

### 🎨 Design Obrigatório
- **Background**: Imagem da barbearia (`barbershop-background.jpg`) com overlay escuro
- **Cards**: Glassmorphism (fundo transparente com blur) via `PainelBarbeiroCard`
- **Texto**: Cores claras (text-urbana-light) para contraste com o fundo escuro
- **Nunca use**: `bg-white`, `bg-background` ou qualquer fundo sólido nos componentes filhos

### 📁 Arquivos Principais (NÃO ALTERAR SEM CUIDADO)

1. **`src/components/barber/BarberLayout.tsx`**
   - Gerencia o background da barbearia
   - Contém o header e navegação
   - Wrapper para todas as páginas do painel
   - **IDÊNTICO** ao PainelClienteLayout

2. **`src/components/barber/BarberPageContainer.tsx`**
   - Container padrão para conteúdo das páginas
   - Define largura, padding e responsividade
   - Inclui header automático com saudação
   - **IDÊNTICO** ao ClientPageContainer

3. **`src/components/barber/PainelBarbeiroCard.tsx`**
   - Cards com glassmorphism
   - 5 variantes: default, highlight, success, warning, info
   - **IDÊNTICO** ao PainelClienteCard

### 🔧 Páginas do Painel

Todas as páginas abaixo DEVEM usar os componentes padrão:
- `src/pages/BarberDashboard.tsx`
- `src/pages/BarberAppointments.tsx`
- `src/pages/BarberSchedule.tsx`
- `src/pages/BarberCommissions.tsx`

### ❌ O QUE NUNCA FAZER

```tsx
// ❌ ERRADO - Não adicione fundos brancos
<div className="bg-white">

// ❌ ERRADO - Não sobrescreva o background do layout
<div className="bg-background">

// ❌ ERRADO - Não use cores escuras de texto
<p className="text-black">

// ❌ ERRADO - Não use StandardCard antigo (DEPRECADO)
import StandardCard from './layouts/StandardCard';
```

### ✅ O QUE FAZER

```tsx
// ✅ CORRETO - Use o container padrão
import { BarberPageContainer } from '@/components/barber/BarberPageContainer';
<BarberPageContainer>

// ✅ CORRETO - Use os cards com glassmorphism
import { 
  PainelBarbeiroCard,
  PainelBarbeiroCardTitle,
  PainelBarbeiroCardHeader,
  PainelBarbeiroCardContent,
  PainelBarbeiroCardFooter
} from '@/components/barber/PainelBarbeiroCard';

<PainelBarbeiroCard variant="highlight">
  <PainelBarbeiroCardHeader>
    <PainelBarbeiroCardTitle>Título</PainelBarbeiroCardTitle>
  </PainelBarbeiroCardHeader>
  <PainelBarbeiroCardContent>
    Conteúdo aqui
  </PainelBarbeiroCardContent>
</PainelBarbeiroCard>

// ✅ CORRETO - Use cores claras de texto
<p className="text-urbana-light">
```

### 📐 Dimensões e Layout

| Elemento | Mobile | Desktop |
|----------|--------|---------|
| Header altura | 72px | 80px |
| Footer menu mobile | ~80px + safe area | N/A (sidebar) |
| Sidebar desktop | N/A | 256-320px |
| Padding top | 72px | 80px |
| Padding bottom | 120px | 48px |
| Max width conteúdo | 1280px (7xl) | 1280px (7xl) |

### 🎨 Variantes dos Cards

| Variante | Cor da Borda | Uso |
|----------|--------------|-----|
| `default` | urbana-light/20 | Cards neutros |
| `highlight` | urbana-gold/30 | Ações principais, receita |
| `success` | green-500/30 | Status concluído |
| `warning` | yellow-500/30 | Alertas, status pendente |
| `info` | blue-500/30 | Informações, agendamentos |

### 🐛 Se o Background Não Aparecer

1. Verifique o console para: `✅ BarberLayout carregado com background da barbearia`
2. Limpe o cache do navegador (Ctrl+Shift+R ou Cmd+Shift+R)
3. Verifique se `barbershop-background.jpg` existe em `src/assets/`
4. Confirme que BarberLayout está nas rotas do App.tsx

### 📝 Consistência com Painel do Cliente

**IMPORTANTE**: O Painel do Barbeiro foi criado como **RÉPLICA EXATA** do Painel do Cliente.
Qualquer mudança em um painel deve ser refletida no outro para manter consistência visual.

| Componente Cliente | Componente Barbeiro |
|-------------------|---------------------|
| PainelClienteLayout | BarberLayout |
| ClientPageContainer | BarberPageContainer |
| PainelClienteCard | PainelBarbeiroCard |
| PainelClienteCardTitle | PainelBarbeiroCardTitle |
| PainelClienteCardHeader | PainelBarbeiroCardHeader |
| PainelClienteCardContent | PainelBarbeiroCardContent |
| PainelClienteCardFooter | PainelBarbeiroCardFooter |

### 🔍 Debug

Se precisar debugar problemas de layout:

```javascript
// No console do navegador:
console.log('Container principal:', document.querySelector('.min-h-screen'));
console.log('Main content:', document.querySelector('main'));
console.log('Background:', document.querySelector('img[alt*="Barbearia"]'));

// Verificar scroll
document.querySelector('main').style.border = '2px solid red';
```

---

## 🚨 ATENÇÃO DESENVOLVEDORES

**Ao editar qualquer arquivo do painel do barbeiro, você DEVE:**
1. Verificar que o background da barbearia continua visível
2. Confirmar que os cards usam glassmorphism (PainelBarbeiroCard)
3. Testar em desktop e mobile
4. NÃO adicionar fundos brancos ou sólidos
5. Manter consistência com o Painel do Cliente

**Se você precisar modificar o design visual, consulte este documento primeiro!**

**NOTA**: O antigo `StandardCard` e `ResponsiveCard` foram substituídos pelo `PainelBarbeiroCard`.
