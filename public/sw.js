// Online-only by design: never store authenticated pages, profiles, photos or messages.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('push', event => {
  event.waitUntil((async () => {
    await self.registration.showNotification('Real Love', {body:'You have new activity. Open Real Love to view it.',icon:'/icons/icon-192.png',badge:'/icons/icon-192.png',tag:'real-love-activity',data:{url:'/#notifications'}});
    if(self.navigator.setAppBadge)await self.navigator.setAppBadge(1).catch(()=>{});
    for(const client of await self.clients.matchAll({type:'window',includeUncontrolled:true}))client.postMessage({type:'real-love-notification'});
  })());
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {const url=new URL('/#notifications',self.location.origin).href;for(const client of await self.clients.matchAll({type:'window',includeUncontrolled:true})){if(new URL(client.url).origin===self.location.origin&&'focus' in client){await client.navigate(url);await client.focus();return;}}await self.clients.openWindow(url);})());
});
self.addEventListener('fetch', event => {
  if (event.request.mode !== 'navigate' || event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).catch(() => new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Real Love · Offline</title><style>body{font:18px/1.6 system-ui;background:#272c70;color:white;margin:0;padding:24px;min-height:85vh;display:grid;place-content:center}main{max-width:32rem}h1{font-size:2rem}button{font:inherit;background:#dfff7b;color:#272c70;border:0;border-radius:12px;padding:12px 24px;cursor:pointer}</style><main><h1>Reconnect to Real Love</h1><p>You’re offline. An internet connection is needed to open profiles and conversations.</p><button onclick="location.reload()">Try again</button></main></html>`, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'" } })));
});
