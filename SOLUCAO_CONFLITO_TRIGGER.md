# Solução: Conflito entre Trigger e Edge Function

## 🔍 Problema Identificado

O sistema estava falhando ao criar perfis de cliente com erro:
```
duplicate key value violates unique constraint "client_profiles_pkey"
```

### Causa Raiz

Havia um **conflito entre duas operações simultâneas**:

1. **Trigger Automático** (`on_auth_user_created_profile`):
   - Dispara AFTER INSERT em `auth.users`
   - Cria automaticamente um perfil em `client_profiles`
   - Usa `whatsapp = 'temp-{user_id}'` como placeholder

2. **Edge Function** (`register-client`):
   - Cria usuário via `signUp()`
   - Tentava fazer `INSERT` manual em `client_profiles`
   - **CONFLITO**: ID já existia (criado pelo trigger)

### Sequência do Erro

```
1. Edge function valida WhatsApp ✅
2. Edge function chama signUp() → cria usuário com ID=X ✅
3. TRIGGER automático cria perfil com ID=X e whatsapp='temp-X' ✅
4. Email de confirmação é enviado ✅
5. Edge function tenta INSERT em client_profiles com ID=X ❌
6. ERRO: "Key (id)=(X) already exists"
7. Rollback deleta usuário de auth.users
8. Perfil órfão pode permanecer em client_profiles
```

## ✅ Solução Implementada

### Mudança Principal

Substituímos `INSERT` por **`UPSERT`** na edge function:

```typescript
// ❌ ANTES (INSERT - conflitava com trigger)
const { error } = await supabaseAdmin
  .from('client_profiles')
  .insert({
    id: authData.user.id,
    nome, whatsapp, data_nascimento
  });

// ✅ AGORA (UPSERT - atualiza graciosamente)
const { error } = await supabaseAdmin
  .from('client_profiles')
  .upsert({
    id: authData.user.id,
    nome, whatsapp, data_nascimento,
    updated_at: new Date().toISOString()
  }, {
    onConflict: 'id',
    ignoreDuplicates: false
  });
```

### Fluxo Corrigido

```
1. Edge function valida WhatsApp (antes de criar usuário) ✅
2. Edge function chama signUp() → cria usuário com ID=X ✅
3. TRIGGER automático cria perfil: 
   - ID=X
   - whatsapp='temp-X' ✅
4. Email de confirmação é enviado ✅
5. Edge function faz UPSERT em client_profiles:
   - Atualiza perfil existente (ID=X)
   - Substitui 'temp-X' por WhatsApp real
   - Adiciona data_nascimento ✅
6. Sucesso! ✅
```

## 🛡️ Proteções Mantidas

### 1. Validação Pré-SignUp
- WhatsApp é validado **ANTES** de criar o usuário
- Evita criação desnecessária de usuários

### 2. Tratamento de Duplicatas
- Se o WhatsApp real já existe em outro perfil:
  - UPSERT falha com erro de unique constraint
  - Rollback deleta o usuário criado
  - Mensagem clara ao usuário

### 3. Normalização de WhatsApp
```typescript
function normalizeWhatsApp(whatsapp: string): string {
  return whatsapp.replace(/\D/g, '');
}
// "(21) 98397-1236" → "21983971236"
```

## 🎯 Benefícios da Solução

1. **Compatível com Trigger**: UPSERT não conflita com criação automática
2. **Robusto**: Trata conflitos graciosamente
3. **Sem Perfis Órfãos**: Sempre atualiza perfil existente
4. **Validação Mantida**: WhatsApp continua sendo validado antes
5. **Rollback Seguro**: Se houver erro, usuário é deletado corretamente

## 📊 Teste da Solução

### Cenário 1: Cadastro Normal
```
✅ WhatsApp validado
✅ Usuário criado
✅ Trigger cria perfil com temp-ID
✅ UPSERT atualiza com dados reais
✅ Email enviado
✅ Sucesso!
```

### Cenário 2: WhatsApp Duplicado
```
✅ WhatsApp validado (não encontra duplicata em temp-*)
✅ Usuário criado
✅ Trigger cria perfil
❌ UPSERT falha (WhatsApp real já existe)
✅ Rollback deleta usuário
✅ Mensagem clara ao cliente
```

### Cenário 3: Email Duplicado
```
❌ signUp falha (email já existe)
✅ Nenhum usuário criado
✅ Mensagem clara ao cliente
```

## 🔧 Arquivos Modificados

- `supabase/functions/register-client/index.ts`
  - Mudança de `insert()` para `upsert()`
  - Remoção de tratamento de erro de chave primária duplicada
  - Simplificação da lógica de rollback

## 📝 Observações Importantes

1. **Trigger é Útil**: Mantemos o trigger pois ele garante que todo usuário tem perfil, mesmo em outros fluxos
2. **WhatsApp Temporário**: O trigger usa `temp-{id}` para evitar conflitos até que o perfil seja atualizado
3. **UPSERT é Idempotente**: Múltiplas chamadas com mesmo ID apenas atualizam, não causam erro
4. **Validação Robusta**: Normalização e verificação em múltiplas tabelas antes do signUp

---

**Data da Correção**: 2025-11-27
**Status**: ✅ Implementado e Deployado
