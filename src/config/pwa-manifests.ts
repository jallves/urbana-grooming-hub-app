export type PWAContext = 'admin' | 'barbeiro' | 'painel-cliente' | 'totem' | 'public';

export interface PWAManifest {
  name: string;
  short_name: string;
  description: string;
  theme_color: string;
  background_color: string;
  start_url: string;
  scope: string;
  display: 'standalone' | 'fullscreen' | 'minimal-ui';
  icons: Array<{
    src: string;
    sizes: string;
    type: string;
    purpose?: string;
  }>;
}

export const pwaManifests: Record<PWAContext, PWAManifest> = {
  admin: {
    name: 'Costa Urbana - Painel Administrativo',
    short_name: 'Admin Costa Urbana',
    description: 'Sistema de gestão administrativa da barbearia',
    theme_color: '#DAA520',
    background_color: '#1A1410',
    start_url: '/admin',
    scope: '/admin',
    display: 'standalone',
    icons: [
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  },
  barbeiro: {
    name: 'Costa Urbana - Painel do Barbeiro',
    short_name: 'Barbeiro Costa Urbana',
    description: 'Sistema profissional para barbeiros',
    theme_color: '#DAA520',
    background_color: '#1A1410',
    start_url: '/barbeiro',
    scope: '/barbeiro',
    display: 'standalone',
    icons: [
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  },
  'painel-cliente': {
    name: 'Costa Urbana - Meus Agendamentos',
    short_name: 'Costa Urbana Cliente',
    description: 'Agende e gerencie seus horários na barbearia',
    theme_color: '#DAA520',
    background_color: '#1A1410',
    start_url: '/painel-cliente',
    scope: '/painel-cliente',
    display: 'standalone',
    icons: [
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  },
  totem: {
    name: 'Costa Urbana - Totem de Autoatendimento',
    short_name: 'Totem Costa Urbana',
    description: 'Sistema de autoatendimento da barbearia',
    theme_color: '#DAA520',
    background_color: '#1A1410',
    start_url: '/totem',
    scope: '/totem',
    display: 'fullscreen',
    icons: [
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  },
  public: {
    name: 'Costa Urbana Barbearia',
    short_name: 'Costa Urbana',
    description: 'Barbearia de excelência',
    theme_color: '#DAA520',
    background_color: '#1A1410',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    icons: [
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  }
};

export function detectPWAContext(pathname: string): PWAContext {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/barbeiro')) return 'barbeiro';
  if (pathname.startsWith('/painel-cliente')) return 'painel-cliente';
  if (pathname.startsWith('/totem')) return 'totem';
  return 'public';
}

export function getPWAManifest(context: PWAContext): PWAManifest {
  return pwaManifests[context];
}
