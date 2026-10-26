self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
// No caching logic yet — this just satisfies the PWA installability requirement.
// Add offline caching here later if you want readings to work with no connection.
