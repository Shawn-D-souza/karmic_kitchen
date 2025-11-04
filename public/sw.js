// public/sw.js

console.log('Service Worker Loaded');

// Listen for a 'push' event
self.addEventListener('push', e => {
  const data = e.data.json();
  
  console.log('Push notification received', data);

  const title = data.title || 'Karmic Kitchen';
  
  // Show the notification
  const options = {
    body: data.body,
    icon: '/icon-192x192.png', // Icon from your public folder
    badge: '/icon-192x192.png', // Icon for the notification bar
  };

  e.waitUntil(
    self.registration.showNotification(title, options)
  );
});