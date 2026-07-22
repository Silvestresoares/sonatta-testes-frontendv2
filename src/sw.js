import { precacheAndRoute } from 'workbox-precaching';

// Necessário para o vite-plugin-pwa injetar a lista de arquivos de cache
precacheAndRoute(self.__WB_MANIFEST || []);

// Escuta o evento 'push' que vem do backend
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();

    const options = {
      body: data.body || 'Você tem uma nova notificação',
      icon: data.icon || '/logo.png',
      badge: data.badge || '/logo.png',
      vibrate: [200, 100, 200],
      data: data.data || { url: '/' },
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Sonatta', options)
    );
  } catch (error) {
    console.error('Erro ao processar notificação push:', error);
  }
});

// Ação ao clicar na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Se já houver uma aba aberta com a mesma URL, foca nela
      for (let client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // Se não, abre uma nova aba
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
