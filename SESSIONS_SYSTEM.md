# 🔐 Sistema de Gerenciamento de Sessões - Costa Urbana

## Visão Geral

Sistema robusto de gerenciamento de sessões com suporte a:
- ✅ Criação automática de sessões no login
- ✅ Atualização em tempo real via Supabase Realtime
- ✅ Logout forçado pelo administrador
- ✅ Monitoramento de atividade
- ✅ Expiração automática após 7 dias

---

## 📋 Fluxo de Sessões

### 1. **Login de Cliente**
1. Cliente faz login em `/painel-cliente/login`
2. `ClientAuthContext` chama `supabase.auth.signInWithPassword()`
3. Trigger `auto_create_session_on_login` detecta mudança em `last_sign_in_at`
4. Função `auto_create_user_session()` cria registro em `user_sessions`:
   - `user_id`: ID do usuário autenticado
   - `user_type`: 'client'
   - `expires_at`: NOW() + 7 dias
   - `is_active`: TRUE
5. Sessão aparece **automaticamente** em Admin → Configurações → Sessões

### 2. **Logout Manual (Botão "Sair")**
1. Cliente clica em botão "Sair" no `PainelClienteLayout`
2. `ClientAuthContext.signOut()` é chamado
3. `supabase.auth.signOut()` invalida token do Supabase Auth
4. Trigger atualiza `user_sessions` marcando `is_active = FALSE` e `logout_at = NOW()`
5. Cliente é redirecionado para `/painel-cliente/login`

### 3. **Logout Forçado pelo Admin**
1. Admin acessa Admin → Configurações → Sessões
2. Clica em "Encerrar Sessão" ao lado da sessão do cliente
3. Função `force_user_logout(user_id, reason)` é executada:
   - Marca sessão como inativa
   - Cria registro em `force_logout_notifications`
4. **Realtime Trigger**: Cliente recebe notificação via WebSocket
5. `useForceLogoutListener` detecta notificação
6. Toast é exibido para o cliente
7. Após 1.5s, `supabase.auth.signOut()` é executado automaticamente
8. Cliente é redirecionado para `/painel-cliente/login`

### 4. **Expiração Automática**
1. Sessões expiram após **7 dias** de inatividade
2. Função `auto_cleanup_expired_sessions()` limpa sessões expiradas
3. Na próxima requisição, Supabase Auth valida token:
   - Se expirado → usuário é deslogado automaticamente
   - Se válido → sessão continua ativa

---

## 🔄 Tempo Real (Realtime)

### Admin - Sessões Ativas
- **Atualização automática**: Tela de sessões se atualiza automaticamente quando:
  - Novo login é detectado
  - Logout manual acontece
  - Admin encerra sessão
- **Polling de segurança**: A cada 30 segundos como backup

### Cliente - Listener de Logout Forçado
- **Channel dedicado**: `force-logout-{user_id}`
- **Event**: INSERT em `force_logout_notifications`
- **Ação**: Logout automático + redirect

---

## 🎯 Regras de Redirect

### Cliente (Painel)
| Ação | Destino |
|------|---------|
| Logout manual (botão "Sair") | `/painel-cliente/login` |
| Logout forçado pelo admin | `/painel-cliente/login` |
| Sessão expirada | `/painel-cliente/login` |
| Botão "Voltar ao site" | `/` (homepage) |
| **NUNCA** redireciona automaticamente para `/` |  |

### Admin/Barbeiro
| Ação | Destino |
|------|---------|
| Logout manual | `/auth` |
| Logout forçado | `/auth` |

---

## 🛠️ Componentes Principais

### Frontend
- `ClientAuthContext`: Gerencia autenticação de clientes
- `AuthContext`: Gerencia autenticação de admins/barbeiros
- `TotemAuthContext`: Gerencia autenticação de totens
- `useForceLogoutListener`: Hook para detectar logout forçado
- `SessionsManagement`: Tela de gerenciamento de sessões (Admin)
- `ForceSignOutUser`: Ferramenta para forçar logout individual

### Backend (Database)
- `user_sessions`: Tabela principal de sessões
- `force_logout_notifications`: Notificações de logout forçado
- `auto_create_user_session()`: Trigger que cria sessões no login
- `force_user_logout()`: Função para admin forçar logout
- `auto_cleanup_expired_sessions()`: Limpeza de sessões expiradas

---

## 📊 Monitoramento de Atividade

| Status | Última Atividade | Cor | Descrição |
|--------|------------------|-----|-----------|
| **Ativo Agora** | < 2 minutos | Verde | Usuário está usando agora |
| **Ativo** | 2-10 minutos | Azul | Usuário ativo recentemente |
| **Inativo Recente** | 10-30 minutos | Amarelo | Usuário pode estar ocioso |
| **Muito Inativo** | > 30 minutos | Vermelho | Usuário provavelmente saiu |

**Importante**: Sessão permanece ATIVA independente da inatividade até:
- Logout manual
- Logout forçado pelo admin
- Expiração após 7 dias

---

## 🔒 Segurança

### RLS Policies
- ✅ Usuários podem ver APENAS suas próprias notificações de logout
- ✅ Apenas admins (master/admin) podem:
  - Ver todas as sessões ativas
  - Forçar logout de outros usuários
  - Criar notificações de logout

### Permissões
- `force_user_logout()`: Requer role 'master' ou 'admin'
- `get_active_sessions()`: Requer role 'master' ou 'admin'
- `mark_logout_notification_processed()`: Apenas o próprio usuário

---

## 🐛 Troubleshooting

### Sessão não aparece após login
**Causa**: Trigger não está funcionando  
**Solução**: Verificar se trigger `auto_create_session_on_login` está ativo

### Cliente não é deslogado quando admin encerra sessão
**Causa**: Realtime não está conectado  
**Solução**: 
1. Verificar console do cliente para `🔔 Configurando listener`
2. Verificar se `force_logout_notifications` tem RLS habilitado
3. Conferir subscription status no console

### Deslogamento automático aos 10 minutos
**Causa**: Cache do React Query expirando  
**Solução**: Já corrigido - cache agora é de 30min/60min

---

## 🚀 Melhorias Futuras

- [ ] Adicionar geolocalização das sessões
- [ ] Histórico de sessões (últimas 30 dias)
- [ ] Alertas de login suspeito (múltiplos dispositivos)
- [ ] Limite de sessões simultâneas por usuário
- [ ] Dashboard de analytics de sessões

---

## 📝 Changelog

### 2025-11-27
- ✅ Implementado sistema de logout forçado com Realtime
- ✅ Corrigido redirect de logout (sempre para tela de autenticação)
- ✅ Estendida expiração de sessões para 7 dias
- ✅ Removido timeout agressivo no `checkUserRoles`
- ✅ Implementado listener de logout forçado em todos os contexts
- ✅ Melhorado monitoramento de status de atividade
