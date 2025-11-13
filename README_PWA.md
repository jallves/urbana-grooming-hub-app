# Sistema de PWAs Separados por Contexto

Este projeto implementa PWAs (Progressive Web Apps) separados para cada contexto da aplicação Costa Urbana.

## 📱 PWAs Disponíveis

### 1. **Painel Administrativo** (`/admin`)
- **Nome:** Costa Urbana - Painel Administrativo
- **Start URL:** `/admin`
- **Scope:** `/admin/`
- **Descrição:** Sistema completo de gestão administrativa
- **Instalação:** Acesse `/install/admin` ou será exibido prompt automático

### 2. **Painel do Barbeiro** (`/barbeiro`)
- **Nome:** Costa Urbana - Painel do Barbeiro
- **Start URL:** `/barbeiro`
- **Scope:** `/barbeiro/`
- **Descrição:** Sistema profissional para barbeiros gerenciarem seus atendimentos
- **Instalação:** Acesse `/install/barbeiro` ou será exibido prompt automático

### 3. **Painel do Cliente** (`/painel-cliente`)
- **Nome:** Costa Urbana - Meus Agendamentos
- **Start URL:** `/painel-cliente`
- **Scope:** `/painel-cliente/`
- **Descrição:** App para clientes agendarem e gerenciarem horários
- **Instalação:** Acesse `/install/painel-cliente` ou será exibido prompt automático

### 4. **Totem de Autoatendimento** (`/totem`)
- **Nome:** Costa Urbana - Totem
- **Start URL:** `/totem`
- **Scope:** `/totem/`
- **Display:** Fullscreen
- **Descrição:** Sistema de autoatendimento para uso em tablets/totems
- **Instalação:** Acesse `/install/totem` ou será exibido prompt automático

### 5. **Site Público** (`/`)
- **Nome:** Costa Urbana Barbearia
- **Start URL:** `/`
- **Scope:** `/`
- **Descrição:** Site institucional da barbearia
- **Instalação:** Acesse `/install` ou `/install/public`

## 🏗️ Arquitetura

### Estrutura de Arquivos

```
src/
├── config/
│   └── pwa-manifests.ts          # Configurações de todos os PWAs
├── hooks/
│   ├── usePWA.ts                  # Hook original (mantido para compatibilidade)
│   └── usePWAContext.ts           # Hook com detecção de contexto
├── components/
│   ├── PWAInstallPrompt.tsx       # Prompt original (mantido)
│   └── PWAInstallPromptContext.tsx # Prompt com contexto dinâmico
├── pages/
│   ├── Install.tsx                # Página de instalação genérica
│   ├── InstallContext.tsx         # Página de instalação por contexto
│   ├── InstallAdmin.tsx           # Redirect para /install/admin
│   ├── InstallBarbeiro.tsx        # Redirect para /install/barbeiro
│   ├── InstallCliente.tsx         # Redirect para /install/painel-cliente
│   └── InstallTotem.tsx           # Redirect para /install/totem
└── public/
    ├── manifest-admin.json        # Manifest do admin
    ├── manifest-barbeiro.json     # Manifest do barbeiro
    ├── manifest-cliente.json      # Manifest do cliente
    └── manifest-totem.json        # Manifest do totem
```

### Como Funciona

1. **Detecção Automática de Contexto**
   - O hook `usePWAContext` detecta automaticamente o contexto baseado na URL atual
   - O manifest correto é carregado dinamicamente via JavaScript
   - O theme-color é atualizado automaticamente

2. **Manifests Separados**
   - Cada contexto tem seu próprio manifest JSON em `/public`
   - Cada manifest tem `start_url` e `scope` específicos
   - Isso permite instalar múltiplos PWAs no mesmo dispositivo

3. **Prompts de Instalação Contextualizados**
   - O componente `PWAInstallPromptContext` mostra o prompt correto para cada área
   - O prompt é exibido 5 segundos após o usuário acessar a área
   - Cada contexto tem seu próprio controle de "dismissed" no localStorage

4. **Páginas de Instalação Personalizadas**
   - Cada contexto tem instruções específicas em `/install/{context}`
   - As instruções são adaptadas para iOS, Android e Desktop
   - Links diretos podem ser compartilhados para instalação específica

## 🚀 Como Usar

### Para Usuários

1. **Instalar um PWA específico:**
   ```
   - Admin: Acesse /admin e clique em "Instalar" quando o prompt aparecer
   - Barbeiro: Acesse /barbeiro e siga as instruções
   - Cliente: Acesse /painel-cliente e instale
   - Totem: Acesse /totem (ideal para tablets)
   ```

2. **Instalar manualmente:**
   ```
   - Acesse /install/admin (ou barbeiro, painel-cliente, totem)
   - Siga as instruções específicas do seu dispositivo
   ```

3. **Múltiplas Instalações:**
   - É possível instalar todos os PWAs no mesmo dispositivo
   - Cada um aparecerá como um app separado na tela inicial
   - Cada um funciona independentemente com suas próprias sessões

### Para Desenvolvedores

1. **Adicionar um novo contexto:**
   ```typescript
   // src/config/pwa-manifests.ts
   export const pwaManifests: Record<PWAContext, PWAManifest> = {
     // ... outros contextos
     'novo-contexto': {
       name: 'Nome do App',
       short_name: 'App',
       description: 'Descrição',
       theme_color: '#DAA520',
       background_color: '#1A1410',
       start_url: '/novo-contexto',
       scope: '/novo-contexto/',
       display: 'standalone',
       icons: [/* ... */]
     }
   };
   ```

2. **Criar manifest JSON (opcional):**
   ```json
   // public/manifest-novo.json
   {
     "name": "Nome do App",
     "start_url": "/novo-contexto",
     "scope": "/novo-contexto/",
     // ... outras configurações
   }
   ```

3. **Criar página de instalação:**
   ```typescript
   // src/pages/InstallNovo.tsx
   import { Navigate } from 'react-router-dom';
   export default () => <Navigate to="/install/novo-contexto" replace />;
   ```

## 🔧 Configuração Técnica

### Service Worker
- O service worker único gerencia cache para todas as áreas
- Estratégia de cache adaptada por tipo de recurso
- Cache offline para todas as funcionalidades

### Compatibilidade
- ✅ Chrome/Edge/Brave (Android e Desktop)
- ✅ Safari (iOS/iPadOS e macOS)
- ✅ Firefox (com limitações)
- ⚠️ Samsung Internet (funciona mas com UX diferente)

### Recursos
- Funciona offline após primeira instalação
- Atualizações automáticas em background
- Notifications (quando implementado)
- Badge na tela inicial
- Splash screen personalizada

## 📝 Benefícios

1. **Organização:** Cada área tem seu próprio app instalável
2. **Performance:** Cada PWA carrega apenas os recursos necessários
3. **UX:** Experiência nativa sem barra de navegador
4. **Flexibilidade:** Usuários escolhem quais apps instalar
5. **Segurança:** Cada app mantém sua própria sessão isolada

## 🐛 Troubleshooting

### PWA não aparece para instalação
- Verifique se está em HTTPS (obrigatório)
- Limpe o cache e service worker
- Verifique se o manifest está sendo carregado corretamente

### Múltiplos prompts aparecendo
- Cada contexto gerencia seu próprio estado de "dismissed"
- Use localStorage.clear() para resetar todos os estados

### Service Worker não atualiza
- Force update com `Ctrl+Shift+R` (ou `Cmd+Shift+R` no Mac)
- Desregistre o service worker nas DevTools
- Limpe o cache do navegador

## 📚 Referências

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
