# 📱 Configuração de Notificações Push

Este documento explica como configurar as notificações push para lembretes de agendamento.

## ⚠️ IMPORTANTE - Requisitos

Para que as notificações funcionem, o cliente precisa:
1. Estar cadastrado na view `painel_clientes` (não apenas na tabela `clients`)
2. Ter email verificado e autenticado via Supabase Auth
3. Navegador compatível com Push API

## 🔑 Gerando VAPID Keys

As VAPID keys são necessárias para autenticar as notificações push. Siga os passos:

### Opção 1: Online (Mais Fácil)
1. Acesse: https://web-push-codelab.glitch.me/
2. Clique em "Generate Keys"
3. Copie as chaves geradas

### Opção 2: Via Node.js
```bash
npm install web-push -g
web-push generate-vapid-keys
```

## ⚙️ Configuração das Variáveis de Ambiente

### 1. Variáveis Locais (.env)
Crie ou edite o arquivo `.env` na raiz do projeto:

```env
VITE_VAPID_PUBLIC_KEY=sua_chave_publica_aqui
```

### 2. Variáveis no Supabase (Edge Functions)
Configure as secrets no Supabase:

```bash
# Via CLI
supabase secrets set VAPID_PUBLIC_KEY="sua_chave_publica_aqui"
supabase secrets set VAPID_PRIVATE_KEY="sua_chave_privada_aqui"
supabase secrets set VAPID_EMAIL="mailto:seu_email@dominio.com"
```

Ou pelo Dashboard:
1. Acesse: https://supabase.com/dashboard/project/SEU_PROJECT_ID/settings/functions
2. Vá em "Edge Functions" > "Secrets"
3. Adicione as 3 variáveis acima

## 🚀 Deploy da Edge Function

Faça o deploy da função que envia os lembretes:

```bash
supabase functions deploy send-appointment-reminders
```

## 🔄 Cron Job

A função `send-appointment-reminders` roda automaticamente a cada hora (configurado em `supabase/config.toml`).

Ela verifica:
- **24 horas antes**: Envia primeiro lembrete
- **4 horas antes**: Envia lembrete final

## 📊 Monitoramento

### Ver logs da função:
```bash
supabase functions logs send-appointment-reminders
```

### Verificar notificações enviadas:
```sql
SELECT * FROM notification_logs 
ORDER BY sent_at DESC 
LIMIT 50;
```

### Ver tokens de push registrados:
```sql
SELECT 
  client_id,
  is_active,
  created_at,
  last_used_at
FROM push_notification_tokens
WHERE is_active = true;
```

## 🧪 Testando

### 1. Ativar notificações no painel do cliente
1. Faça login no painel cliente
2. Um prompt aparecerá pedindo permissão
3. Clique em "Ativar Notificações"

### 2. Criar um agendamento de teste
Crie um agendamento para daqui a algumas horas para testar.

### 3. Executar função manualmente
```bash
# Invoca a função para teste
curl -X POST https://SEU_PROJECT_ID.supabase.co/functions/v1/send-appointment-reminders \
  -H "Authorization: Bearer SEU_ANON_KEY"
```

## 🔧 Troubleshooting

### Notificações não aparecem?
1. Verifique se o navegador suporta push notifications
2. Confirme que a permissão foi concedida
3. Verifique se o service worker está registrado: Dev Tools > Application > Service Workers
4. Veja os logs da edge function

### Service Worker não registra?
1. Certifique-se que o arquivo `public/sw.js` existe
2. Verifique no console do navegador se há erros
3. HTTPS é necessário (exceto localhost)

### Logs da Edge Function mostram erro?
1. Verifique se as VAPID keys estão configuradas corretamente
2. Confirme que as 3 variáveis de ambiente estão definidas
3. Verifique se há tokens de push válidos no banco

## 📱 Navegadores Suportados

- ✅ Chrome/Edge (Desktop e Android)
- ✅ Firefox (Desktop e Android)
- ✅ Safari (macOS 13+, iOS 16.4+)
- ✅ Samsung Internet
- ❌ Safari (iOS < 16.4)
- ❌ Internet Explorer

## 🔐 Segurança

- Tokens de push são armazenados criptografados no banco
- RLS policies garantem que clientes só acessem seus próprios tokens
- VAPID keys nunca são expostas no frontend (apenas a pública)
- Notificações só são enviadas para tokens ativos

## 📝 Estrutura do Banco

### Tabela: `push_notification_tokens`
Armazena os tokens de inscrição push de cada cliente.

### Tabela: `notification_logs`
Registra histórico de notificações enviadas (evita duplicatas).

## 🎯 Próximos Passos

Após configurar:
1. ✅ Gere as VAPID keys
2. ✅ Configure as variáveis de ambiente
3. ✅ Faça deploy da edge function
4. ✅ Teste com um agendamento real
5. ✅ Monitore os logs

---

**Dúvidas?** Consulte a documentação do web-push: https://github.com/web-push-libs/web-push
