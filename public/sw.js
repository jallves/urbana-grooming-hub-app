const CACHE_NAME = 'totem-v1';
const QUEUE_NAME = 'totem-requests-queue';

// Instalar e ativar
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando service worker...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando service worker...');
  event.waitUntil(self.clients.claim());
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Apenas POST para fila offline
  if (request.method !== 'POST') {
    return event.respondWith(fetch(request));
  }

  // URLs que devem ser enfileiradas
  const queueableUrls = [
    '/functions/v1/totem-checkin',
    '/functions/v1/totem-checkout',
    '/functions/v1/payments-pix',
    '/functions/v1/payments-card'
  ];

  const shouldQueue = queueableUrls.some(url => request.url.includes(url));

  if (!shouldQueue) {
    return event.respondWith(fetch(request));
  }

  event.respondWith(
    (async () => {
      try {
        // Tentar fazer a requisição
        const response = await fetch(request.clone());
        
        if (response.ok) {
          return response;
        }
        
        throw new Error('Network error');
      } catch (error) {
        // Se falhar, adicionar à fila offline
        console.log('[SW] Sem conexão, enfileirando requisição...');
        
        try {
          const body = await request.clone().text();
          const entry = {
            url: request.url,
            method: request.method,
            headers: Array.from(request.headers.entries()),
            body: body,
            timestamp: Date.now()
          };

          // Salvar na fila
          const cache = await caches.open(QUEUE_NAME);
          const queueKey = new Request(`${request.url}?ts=${entry.timestamp}`);
          await cache.put(queueKey, new Response(JSON.stringify(entry)));

          // Retornar resposta indicando que foi enfileirado
          return new Response(
            JSON.stringify({ 
              queued: true, 
              message: 'Requisição enfileirada. Será processada quando houver conexão.',
              timestamp: entry.timestamp 
            }), 
            { 
              status: 202,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        } catch (queueError) {
          console.error('[SW] Erro ao enfileirar:', queueError);
          return new Response(
            JSON.stringify({ error: 'Erro ao processar offline' }), 
            { status: 500 }
          );
        }
      }
    })()
  );
});

// Background Sync - processar fila quando conexão voltar
self.addEventListener('sync', (event) => {
  console.log('[SW] Evento sync:', event.tag);
  
  if (event.tag === 'retry-queued-requests') {
    event.waitUntil(processQueue());
  }
});

// Processar fila
async function processQueue() {
  console.log('[SW] Processando fila...');
  
  try {
    const cache = await caches.open(QUEUE_NAME);
    const requests = await cache.keys();
    
    console.log(`[SW] ${requests.length} requisições na fila`);
    
    for (const request of requests) {
      try {
        const response = await cache.match(request);
        const entry = await response.json();
        
        // Recriar requisição
        const headers = new Headers(entry.headers);
        const fetchRequest = new Request(entry.url, {
          method: entry.method,
          headers: headers,
          body: entry.body
        });
        
        // Tentar enviar
        const fetchResponse = await fetch(fetchRequest);
        
        if (fetchResponse.ok) {
          console.log('[SW] Requisição processada com sucesso:', entry.url);
          await cache.delete(request);
          
          // Notificar clientes
          const clients = await self.clients.matchAll();
          clients.forEach(client => {
            client.postMessage({
              type: 'QUEUE_PROCESSED',
              url: entry.url,
              timestamp: entry.timestamp
            });
          });
        } else {
          console.warn('[SW] Requisição falhou, mantendo na fila:', entry.url);
        }
      } catch (error) {
        console.error('[SW] Erro ao processar requisição:', error);
        // Manter na fila para tentar novamente
      }
    }
  } catch (error) {
    console.error('[SW] Erro ao processar fila:', error);
  }
}

// Mensagens do cliente
self.addEventListener('message', (event) => {
  console.log('[SW] Mensagem recebida:', event.data);
  
  if (event.data.type === 'RETRY_QUEUE') {
    processQueue();
  }
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notificar quando estiver online novamente
self.addEventListener('online', () => {
  console.log('[SW] Conexão restaurada, processando fila...');
  processQueue();
});
