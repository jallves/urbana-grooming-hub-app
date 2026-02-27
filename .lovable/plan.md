

## Plano: Login com Google para Clientes

### Pré-requisitos (configuração manual no Google Cloud + Supabase)

1. **Google Cloud Console**: Criar credenciais OAuth 2.0 (Web Application)
   - Authorized JavaScript origins: `https://barbeariacostaurbana.lovable.app`
   - Authorized redirect URL: `https://apizqnknnmjqpqovlkux.supabase.co/auth/v1/callback`

2. **Supabase Dashboard** → Authentication → Providers → Google
   - Colar Client ID e Client Secret do Google Cloud
   - Habilitar o provider

3. **Supabase Dashboard** → Authentication → URL Configuration
   - Site URL: `https://barbeariacostaurbana.lovable.app`
   - Redirect URLs: `https://barbeariacostaurbana.lovable.app/painel-cliente/completar-cadastro`

### Implementação no código (após configuração acima)

#### 1. Botão "Entrar com Google" na tela de login
- Adicionar botão no `PainelClienteLoginForm.tsx` que chama `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })`

#### 2. Nova página `/painel-cliente/completar-cadastro`
- Formulário com campos obrigatórios: **WhatsApp** e **Data de Nascimento**
- Exibido apenas no primeiro login com Google (quando `painel_clientes` não tem registro completo)
- Ao submeter, cria/atualiza o registro em `painel_clientes` com `user_id`, `nome` (do Google), `email` (do Google), `whatsapp` e `data_nascimento`

#### 3. Lógica de redirecionamento no `PainelClienteAuthContext`
- Após login Google, verificar se o perfil em `painel_clientes` existe e tem `whatsapp` preenchido
- Se não tiver → redirecionar para `/painel-cliente/completar-cadastro`
- Se tiver → ir direto para o dashboard

#### 4. Rota protegida
- Adicionar rota `/painel-cliente/completar-cadastro` no router

### Sobre confirmação de e-mail
- **Não será necessária** — o Google já verifica o e-mail. O campo `email_verified` vem como `true` automaticamente.

### Detalhes técnicos
- O `nome` e `email` são extraídos de `user.user_metadata.full_name` e `user.email` (fornecidos pelo Google)
- A role `user` será atribuída automaticamente ao criar o perfil (mesmo fluxo da edge function `register-client`)
- O link-client-profile existente já tenta vincular por e-mail, o que cobre casos de clientes que já tinham cadastro manual

