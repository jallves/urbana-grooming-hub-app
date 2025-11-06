# 👤 Como Criar o Primeiro Usuário Admin

## 🎯 Visão Geral

Após as correções de segurança, as credenciais hardcoded foram removidas. Agora você precisa criar manualmente o primeiro usuário administrador através do Supabase Dashboard.

## 📝 Passo a Passo

### 1. Acesse o Supabase Dashboard

Abra o link: https://supabase.com/dashboard/project/bqftkknbvmggcbsubicl

### 2. Navegue para Authentication → Users

1. No menu lateral, clique em **Authentication**
2. Clique na aba **Users**
3. Clique no botão **Add User** (ou **Invite User**)

### 3. Preencha os Dados do Admin

```
Email: seu-email@dominio.com
Password: [Senha forte com 12+ caracteres]
Auto Confirm User: ✅ Ativo (para não precisar confirmar email)
```

**⚠️ Importante:** Anote a senha em local seguro!

### 4. Adicione a Role de Admin

Após criar o usuário, você precisa adicionar a role de admin:

1. Copie o **User ID** (UUID) do usuário criado
2. Vá para **SQL Editor** no menu lateral
3. Execute o seguinte SQL:

```sql
-- Substitua 'USER_ID_AQUI' pelo UUID do usuário criado
INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_ID_AQUI', 'admin');
```

**Exemplo:**
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'admin');
```

### 5. Faça Login

Agora você pode fazer login no painel admin:

1. Acesse: [https://seu-dominio.com/auth](https://seu-dominio.com/auth)
2. Use o email e senha cadastrados
3. Você será redirecionado para `/admin`

## 🔐 Segurança

### Senha Forte
Uma senha forte deve ter:
- ✅ Mínimo 12 caracteres
- ✅ Letras maiúsculas e minúsculas
- ✅ Números
- ✅ Caracteres especiais (@, #, $, !, etc)

**Exemplo de senha forte:** `CostaUrbana2024!#Admin`

### Não Compartilhe
- ❌ Nunca compartilhe credenciais de admin
- ❌ Não use a mesma senha em outros sites
- ❌ Não salve senha em navegador público

## 🆘 Problemas Comuns

### "Erro ao fazer login"
- Verifique se o usuário foi criado no Supabase
- Confirme que a role 'admin' foi adicionada
- Tente fazer logout completo e login novamente

### "Acesso Negado"
- Verifique se a role está correta: `SELECT * FROM user_roles WHERE user_id = 'SEU_USER_ID';`
- Confirme que o email está correto

### "Conta Bloqueada"
- Se errou a senha 5 vezes, aguarde 15 minutos
- Ou limpe o localStorage do navegador:
  ```javascript
  // Console do navegador (F12)
  localStorage.removeItem('loginBlock');
  ```

## 🔄 Criar Mais Admins

Para criar mais usuários admin, repita o processo acima ou:

1. Faça login como admin existente
2. (Futuro) Use o painel de gerenciamento de usuários

---

## 📞 Suporte

Se precisar de ajuda:
1. Verifique os logs do Supabase: Authentication → Logs
2. Consulte a documentação: `SECURITY.md`
3. Entre em contato com o suporte técnico

---

**✅ Checklist de Configuração Inicial**

- [ ] Criar primeiro usuário no Supabase Dashboard
- [ ] Adicionar role 'admin' via SQL
- [ ] Fazer login no painel
- [ ] Alterar senha após primeiro login
- [ ] Ativar 2FA (quando disponível)
- [ ] Criar backup do user_id e credenciais (em local seguro)

---

**Última atualização:** 06/11/2024
