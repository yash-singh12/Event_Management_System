// Service Worker Installation
self.addEventListener('install', (event) => {
    console.log('Service Worker installed');
    self.skipWaiting();
});

// Service Worker Activation
self.addEventListener('activate', (event) => {
    console.log('Service Worker activated');
    event.waitUntil(clients.claim());
});

// Push Event Handler
self.addEventListener('push', function(event) {
    console.log('Push event received');
    try {
        const data = event.data.json();
        console.log('Push data:', data);
        
        const options = {
            body: data.body,
            icon: data.icon || '/icon.png',
            badge: '/icon.png',
            data: data.url,
            vibrate: [200, 100, 200],
            requireInteraction: true
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    } catch (error) {
        console.error('Error handling push event:', error);
    }
});

// Notification Click Handler
self.addEventListener('notificationclick', function(event) {
    console.log('Notification clicked');
    event.notification.close();

    if (event.notification.data) {
        event.waitUntil(
            clients.openWindow(event.notification.data)
        );
    }
});