/* Fidelity push messaging service worker.
   Handles web-push notifications only — no app-shell caching. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Fidelity", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "Fidelity";
  const options = {
    body: payload.body || "",
    icon: "/fidelity-app-icon-192.png",
    badge: "/fidelity-app-icon-192.png",
    tag: payload.tag || undefined,
    renotify: Boolean(payload.tag),
    vibrate: [80, 40, 80],
    data: { url: payload.url || "/dashboard" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/dashboard";
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of all) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) await client.navigate(target);
          return;
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});
