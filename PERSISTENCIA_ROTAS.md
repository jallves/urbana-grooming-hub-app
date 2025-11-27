# Sistema de Persistência de Rotas

## Visão Geral

Sistema robusto que mantém o usuário na mesma página após **qualquer tipo de refresh** (F5, Ctrl+F5, Ctrl+R, Ctrl+Shift+R) em todos os painéis da aplicação.

## Como Funciona

### 1. **Salvamento Automático de Rota**

Cada route guard salva automaticamente a rota atual no localStorage quando:
- O usuário está autenticado
- A verificação de roles está completa
- Não está em loading

```typescript
// Exemplo: AdminRoute
useEffect(() => {
  if (!loading && rolesChecked && user) {
    localStorage.setItem('admin_last_route', location.pathname);
  }
}, [location.pathname, loading, rolesChecked, user]);
```

### 2. **Proteção Contra Redirecionamento Durante Loading**

**CRÍTICO:** Durante o loading inicial, **NUNCA** redirecionamos o usuário. Isso garante que a página não "pule" para login ou homepage durante a verificação de autenticação.

```typescript
if (loading || !rolesChecked) {
  return <LoaderPage />; // Apenas mostra loading, SEM redirecionar
}
```

### 3. **Manutenção da Rota Após Verificação**

Após verificar a autenticação:
- **Se autenticado:** Mantém na rota atual (não redireciona)
- **Se não autenticado:** Aí sim redireciona para login

## Implementação por Painel

### Admin Panel (`AdminRoute.tsx`)
- **Storage key:** `admin_last_route`
- **Tipos de usuário:** master, admin, manager, barber (quando permitido)
- **Timeout:** 8 segundos com popup de recuperação

### Painel Cliente (`ClientRoute.tsx`)
- **Storage key:** `client_last_route`
- **Tipos de usuário:** client
- **Redirect de logout:** `/painel-cliente/login`

### Painel Barbeiro (`BarberRoute.tsx`)
- **Storage key:** `barber_last_route`
- **Tipos de usuário:** barber, admin, manager, master
- **Redirect de logout:** `/barbeiro/login`

### Totem (`TotemProtectedRoute.tsx`)
- **Storage key:** `totem_last_route`
- **Tipos de usuário:** totem
- **Redirect de logout:** `/totem/login`

## Fluxo de Funcionamento

### Cenário 1: Refresh em Página Autenticada

1. Usuário está em `/admin/agendamentos`
2. Pressiona F5
3. **Durante loading:** Página mostra "Carregando..." SEM redirecionar
4. **Após verificação:** Usuário está autenticado
5. **Resultado:** Permanece em `/admin/agendamentos` ✅

### Cenário 2: Refresh Sem Autenticação

1. Usuário não está logado
2. Tenta acessar `/painel-cliente/dashboard`
3. **Durante loading:** Página mostra "Carregando..." SEM redirecionar
4. **Após verificação:** Usuário NÃO está autenticado
5. **Resultado:** Redireciona para `/painel-cliente/login` ✅

### Cenário 3: Sessão Expirada

1. Usuário estava em `/admin/financeiro`
2. Sessão expirou
3. Pressiona F5
4. **Durante loading:** Página mostra "Carregando..."
5. **Após verificação:** Sessão inválida
6. **Resultado:** Redireciona para `/auth` (login admin) ✅

## Regras Críticas

### ✅ O Que FAZER

1. **Sempre aguardar `rolesChecked` antes de qualquer ação**
2. **Salvar rota apenas quando usuário está autenticado e verificado**
3. **Mostrar loading durante verificação inicial**
4. **Usar `replace: true` nos redirects para não adicionar ao histórico**

### ❌ O Que NÃO FAZER

1. **NUNCA redirecionar durante `loading` ou antes de `rolesChecked`**
2. **NUNCA redirecionar para homepage quando logout de cliente/barbeiro**
3. **NUNCA assumir autenticação antes da verificação completa**
4. **NUNCA limpar localStorage de rota durante refresh**

## Limpeza de Rotas Salvas

As rotas são limpas automaticamente em 2 situações:

1. **Logout explícito:** Quando usuário clica em "Sair"
   ```typescript
   localStorage.removeItem('barber_last_route');
   ```

2. **Sessão expirada:** Quando redirecionado para login por falta de autenticação

## Debugging

Para debug, verifique no console:

```javascript
// Ver rota salva para cada painel
console.log('Admin:', localStorage.getItem('admin_last_route'));
console.log('Cliente:', localStorage.getItem('client_last_route'));
console.log('Barbeiro:', localStorage.getItem('barber_last_route'));
console.log('Totem:', localStorage.getItem('totem_last_route'));

// Limpar todas as rotas salvas (útil para testes)
localStorage.removeItem('admin_last_route');
localStorage.removeItem('client_last_route');
localStorage.removeItem('barber_last_route');
localStorage.removeItem('totem_last_route');
```

## Benefícios

✅ **Melhor UX:** Usuário nunca perde contexto após refresh  
✅ **Menos confusão:** Não é redirecionado inesperadamente para login/homepage  
✅ **Mais profissional:** Sistema se comporta como aplicação nativa  
✅ **Debug facilitado:** Fácil identificar onde usuário estava antes do refresh  

## Compatibilidade

Funciona com todos os tipos de refresh:
- F5
- Ctrl + F5 (hard refresh)
- Ctrl + R
- Ctrl + Shift + R
- Botão de refresh do navegador
- Recarregar via DevTools

## Suporte Multi-Painel

O sistema funciona independentemente em cada painel:
- Admin pode estar em uma rota específica
- Cliente em outra
- Barbeiro em outra
- Totem em outra

Cada um mantém seu próprio estado de navegação sem interferir nos demais.
