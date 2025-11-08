# 📱 Costa Urbana - PWA (Progressive Web App)

## ✨ O que é um PWA?

Seu app agora é um **Progressive Web App**, o que significa que:

- ✅ **Instalável**: Pode ser instalado direto do navegador, sem App Store ou Google Play
- ✅ **Funciona Offline**: Continue usando mesmo sem internet
- ✅ **Rápido**: Carregamento instantâneo e performance nativa
- ✅ **Multi-Plataforma**: Funciona em iPhone, Android, Tablet e Desktop
- ✅ **Atualizações Automáticas**: Sempre a versão mais recente
- ✅ **Notificações**: Pode receber notificações push (se habilitado)

## 📲 Como Instalar

### iPhone / iPad (Safari)

1. Abra o site no **Safari**
2. Toque no botão **Compartilhar** (quadrado com seta para cima)
3. Role para baixo e toque em **"Adicionar à Tela de Início"**
4. Toque em **"Adicionar"**
5. Pronto! O ícone aparecerá na sua tela inicial

### Android (Chrome)

**Opção 1 - Automática:**
1. Um banner aparecerá automaticamente perguntando se quer instalar
2. Toque em **"Instalar"**

**Opção 2 - Manual:**
1. Toque nos **três pontos** no canto superior direito
2. Toque em **"Instalar app"** ou **"Adicionar à tela inicial"**
3. Confirme tocando em **"Instalar"**

### Desktop (Chrome, Edge, Brave)

**Opção 1 - Automática:**
1. Um ícone de instalação aparecerá na barra de endereços
2. Clique no ícone e depois em **"Instalar"**

**Opção 2 - Manual:**
1. Clique nos **três pontos** no canto superior direito
2. Clique em **"Instalar Costa Urbana Barbearia"**
3. Confirme clicando em **"Instalar"**

## 🎯 Página de Instalação

Acesse `/pwa-install` para ver instruções detalhadas e instalar o app:

```
https://seu-site.com/pwa-install
```

## 🔧 Funcionalidades PWA

### Modo Offline

O app funciona offline graças ao Service Worker que:
- Armazena em cache recursos essenciais (HTML, CSS, JS)
- Mantém dados do Supabase em cache por 24 horas
- Permite usar o app mesmo sem conexão

### Atualizações Automáticas

Quando há uma nova versão:
1. O app baixa automaticamente em segundo plano
2. Um prompt aparece perguntando se quer atualizar
3. Ao confirmar, a página recarrega com a nova versão

### Responsividade Total

O app está 100% otimizado para:
- 📱 **Mobile** (320px - 767px)
- 📱 **Tablet** (768px - 1023px)  
- 💻 **Desktop** (1024px+)

Todos os componentes são responsivos:
- ✅ Totem
- ✅ Painel Admin
- ✅ Painel Cliente
- ✅ Painel Barbeiro
- ✅ Formulários
- ✅ Cards
- ✅ Modais
- ✅ Tabelas

## 🎨 Ícones do App

O PWA inclui ícones otimizados para todas as plataformas:

- `pwa-192x192.png` - Ícone padrão Android
- `pwa-512x512.png` - Ícone de alta qualidade
- `apple-touch-icon.png` - Ícone para iOS
- `favicon.png` - Favicon do navegador

## 🚀 Para Desenvolvedores

### Configuração

O PWA está configurado no `vite.config.ts`:

```typescript
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.png', 'apple-touch-icon.png'],
  manifest: {
    name: 'Costa Urbana Barbearia',
    short_name: 'Costa Urbana',
    theme_color: '#000000',
    // ... mais configurações
  }
})
```

### Service Worker

O Service Worker é registrado automaticamente em `src/main.tsx` e:
- Cache recursos estáticos
- Cache chamadas da API Supabase
- Funciona em modo NetworkFirst para dados dinâmicos

### Hooks Customizados

Use o hook `usePWA()` para controlar instalação:

```tsx
import { usePWA } from '@/hooks/usePWA';

const { canInstall, isInstalled, installApp } = usePWA();

// Instalar o app programaticamente
await installApp();
```

### Componentes

**PWAInstallPrompt** - Prompt flutuante de instalação:
```tsx
<PWAInstallPrompt />
```

Aparece automaticamente após 10 segundos se:
- App pode ser instalado
- App não está instalado
- Usuário não dispensou o prompt

## 📊 Testando

### Chrome DevTools

1. Abra DevTools (F12)
2. Vá em **Application** → **Service Workers**
3. Veja o status do Service Worker
4. Teste modo offline com **Offline checkbox**

### Lighthouse

Execute Lighthouse para verificar score PWA:

1. DevTools → **Lighthouse**
2. Selecione **Progressive Web App**
3. Clique em **Analyze page load**
4. Score ideal: 100/100 ✅

## 🔒 Segurança

O PWA requer HTTPS em produção. No desenvolvimento, localhost é permitido.

## 📱 Suporte de Navegadores

| Navegador | Instalação | Offline | Notificações |
|-----------|------------|---------|--------------|
| Chrome    | ✅         | ✅      | ✅           |
| Edge      | ✅         | ✅      | ✅           |
| Safari    | ✅         | ✅      | ⚠️           |
| Firefox   | ✅         | ✅      | ✅           |
| Samsung   | ✅         | ✅      | ✅           |

⚠️ Safari iOS tem suporte limitado a notificações push

## 🎉 Pronto!

Seu app Costa Urbana agora é um PWA completo e pode ser instalado em qualquer dispositivo!

Para mais informações:
- [MDN - Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [web.dev - PWA](https://web.dev/progressive-web-apps/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
