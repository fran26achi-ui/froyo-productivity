// Froyo Background Firebase Cloud Messaging Service Worker
/* eslint-disable no-undef */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle background push event
self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload = { title: 'Froyo Notification', body: event.data.text() };
    }
  }

  const notificationTitle =
    payload.notification?.title || payload.title || 'Froyo Sanctuary Alert';
  const notificationOptions = {
    body:
      payload.notification?.body ||
      payload.body ||
      'Your companion mascot is waiting for you in Froyo!',
    icon: '/froyo-logo.svg',
    badge: '/froyo-logo.svg',
    data: payload.data || {},
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open_app', title: 'Open Workspace' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});

// Handle notification click to focus or open Froyo window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
  );
});
