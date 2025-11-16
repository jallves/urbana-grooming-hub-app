# ⚠️ ESTRUTURA DO PAINEL DO CLIENTE - LEIA ANTES DE EDITAR ⚠️

## IMPORTANTE: Background da Barbearia

O Painel do Cliente tem uma estrutura visual específica que **NUNCA** deve ser alterada:

### 🎨 Design Obrigatório
- **Background**: Imagem da barbearia (`barbershop-background.jpg`) com overlay escuro
- **Cards**: Glassmorphism (fundo transparente com blur)
- **Texto**: Cores claras (text-urbana-light) para contraste com o fundo escuro
- **Nunca use**: `bg-white`, `bg-background` ou qualquer fundo sólido nos componentes filhos

### 📁 Arquivos Principais (NÃO ALTERAR SEM CUIDADO)

1. **`src/components/painel-cliente/PainelClienteLayout.tsx`**
   - Gerencia o background da barbearia
   - Contém o header e navegação
   - Wrapper para todas as páginas do painel

2. **`src/components/painel-cliente/PainelClienteContentContainer.tsx`**
   - Container transparente para conteúdo
   - NUNCA adicione backgrounds aqui

3. **`src/components/painel-cliente/PainelClienteCard.tsx`**
   - Cards com glassmorphism
   - Usa backdrop-blur e fundos semi-transparentes

### 🔧 Páginas do Painel

Todas as páginas abaixo DEVEM usar o layout padrão:
- `src/pages/PainelClienteDashboard.tsx`
- `src/pages/PainelClienteNovoAgendamento.tsx`
- `src/pages/PainelClienteMeusAgendamentos.tsx`
- `src/pages/PainelClientePerfil.tsx`

### ❌ O QUE NUNCA FAZER

```tsx
// ❌ ERRADO - Não adicione fundos brancos
<div className="bg-white">

// ❌ ERRADO - Não sobrescreva o background do layout
<div className="bg-background">

// ❌ ERRADO - Não use cores escuras de texto
<p className="text-black">
```

### ✅ O QUE FAZER

```tsx
// ✅ CORRETO - Use containers transparentes
<PainelClienteContentContainer>

// ✅ CORRETO - Use cards com glassmorphism
<PainelClienteCard variant="default">

// ✅ CORRETO - Use cores claras de texto
<p className="text-urbana-light">
```

### 🐛 Se o Background Não Aparecer

1. Verifique o console do navegador para o log: `✅ PainelClienteLayout carregado com background da barbearia`
2. Limpe o cache do navegador (Ctrl+Shift+R ou Cmd+Shift+R)
3. Verifique se o arquivo `barbershop-background.jpg` existe em `src/assets/`
4. Confirme que o PainelClienteLayout está sendo usado nas rotas do App.tsx

### 🔍 Debug

Se precisar debugar:
```javascript
// No console do navegador:
console.log('Layout atual:', document.querySelector('.min-h-screen'));
console.log('Background:', document.querySelector('img[alt*="Barbearia"]'));
```

### 📝 Notas de Desenvolvimento

- **Cache**: O navegador pode cachear a versão antiga. Sempre force refresh (Ctrl+Shift+R)
- **Build**: Após mudanças, faça rebuild se necessário
- **Mobile**: Teste sempre em mobile para garantir responsividade

---

## 🚨 ATENÇÃO DESENVOLVEDORES

**Ao editar qualquer arquivo do painel do cliente, você DEVE:**
1. Verificar que o background da barbearia continua visível
2. Confirmar que os cards usam glassmorphism
3. Testar em desktop e mobile
4. NÃO adicionar fundos brancos ou sólidos

**Se você precisar modificar o design visual, consulte este documento primeiro!**
