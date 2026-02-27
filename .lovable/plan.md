
# Plano: WhatsApp, Agendar Agora, Logs de Segurança e Sessões

## Resumo das Descobertas

Após análise detalhada do código:

1. **Botão WhatsApp**: O componente existe mas depende de configurações que não estão no banco
2. **Botão "Agendar Agora"**: Já funciona corretamente - redireciona para o painel do cliente
3. **Logs de Segurança**: O sistema foi criado mas NUNCA foi conectado aos módulos
4. **Sessões**: O sistema existe mas só funciona para o Totem, não para Admin/Barbeiro/Cliente

---

## Parte 1: Botão WhatsApp com Número Fixo

**Objetivo**: Exibir o botão flutuante do WhatsApp com o número `5527997780137`

**Alterações**:
- Modificar `src/components/WhatsAppButton.tsx` para usar o número fixo `5527997780137` como fallback principal
- Manter a busca de configurações para flexibilidade futura
- Garantir que o botão sempre apareça na homepage

---

## Parte 2: Botão "Agendar Agora"

**Status**: Já está funcionando corretamente!

O botão no Hero já redireciona para `/painel-cliente/login`, que é exatamente o comportamento esperado para facilitar o acesso ao painel do cliente.

---

## Parte 3: Logs de Segurança (Integração Completa)

**Problema Identificado**: O hook `useActivityLogger` foi criado mas nunca foi importado ou usado em nenhum componente.

**Arquivos que precisam integrar o logger**:

| Módulo | Arquivo | Ações a Registrar |
|--------|---------|-------------------|
| Login Admin | `LoginForm.tsx` | login, logout |
| Login Barbeiro | `BarberLoginForm.tsx`, `useBarberLogin.ts` | login, logout |
| Login Cliente | `PainelClienteLogin.tsx` | login, logout |
| Gestão Usuários | `UserManagement.tsx` | create, update, delete |
| Gestão Clientes | `ClientManagement` | create, update, delete |
| Agendamentos | `AppointmentManagement` | create, cancel, complete, absent |
| Configurações | `Settings` components | update |

**Implementação**:
1. Importar `useActivityLogger` ou `logAdminActivity` nos componentes
2. Chamar as funções de log após cada ação bem-sucedida
3. Garantir que o `admin_id` seja capturado corretamente

---

## Parte 4: Gestão de Sessões (Integração Completa)

**Problema Identificado**: O `sessionManager.createSession()` só está sendo chamado no `TotemAuthContext`. Os outros contextos de autenticação não criam sessões.

**Arquivos que precisam integrar sessões**:

| Contexto | Arquivo | Status Atual |
|----------|---------|--------------|
| Admin | `LoginForm.tsx` | Sem sessão |
| Barbeiro | `BarberLoginForm.tsx` | Sem sessão |
| Cliente | `PainelClienteLogin.tsx` | Sem sessão |
| Totem | `TotemAuthContext.tsx` | Funcionando |

**Implementação**:
1. Importar `sessionManager` nos componentes de login
2. Chamar `createSession()` após login bem-sucedido
3. Chamar `invalidateSession()` no logout
4. Atualizar atividade durante a navegação

---

## Arquivos a Modificar

### WhatsApp
- `src/components/WhatsAppButton.tsx`

### Logs de Segurança
- `src/components/auth/LoginForm.tsx`
- `src/components/barber/auth/BarberLoginForm.tsx`
- `src/pages/PainelClienteLogin.tsx`
- Componentes de gestão (clientes, agendamentos, usuários)

### Sessões
- `src/components/auth/LoginForm.tsx`
- `src/components/barber/auth/BarberLoginForm.tsx`
- `src/pages/PainelClienteLogin.tsx`
- `src/contexts/AuthContext.tsx` (logout)
- `src/contexts/ClientAuthContext.tsx` (logout)

---

## Seção Técnica

### Exemplo de Integração de Log (LoginForm.tsx)

```typescript
import { logAdminActivity } from '@/hooks/useActivityLogger';

// Após login bem-sucedido:
await logAdminActivity({
  action: 'login',
  entityType: 'session',
  entityId: user.id,
  newData: { email: user.email, timestamp: new Date().toISOString() }
});
```

### Exemplo de Integração de Sessão (LoginForm.tsx)

```typescript
import { sessionManager } from '@/hooks/useSessionManager';

// Após login bem-sucedido:
await sessionManager.createSession({
  userId: user.id,
  userType: 'admin',
  userEmail: user.email,
  userName: user.name,
  expiresInHours: 24
});
```

### Exemplo de Logout com Invalidação

```typescript
// No logout:
await sessionManager.invalidateSession('admin');
await logAdminActivity({
  action: 'logout',
  entityType: 'session',
  entityId: userId,
  oldData: { email, timestamp: new Date().toISOString() }
});
```

---

## Resultado Esperado

Após implementação:

1. **WhatsApp**: Botão verde fixo no canto inferior direito da homepage, sempre visível, redirecionando para o WhatsApp com o número `5527997780137`

2. **Logs de Segurança**: Todas as ações administrativas (login, logout, criar, editar, excluir) serão registradas em tempo real na aba "Log de Segurança"

3. **Sessões**: Todas as sessões ativas serão exibidas na aba "Sessões", com possibilidade de forçar logout e monitorar atividade em tempo real
