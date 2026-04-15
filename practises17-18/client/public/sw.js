const CACHE_NAME = "app-shell-v2";
const DYNAMIC_CACHE_NAME = "dynamic-content-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/app.js",
  "/manifest.json",
  "/content/home.html",
  "/content/about.html",
  "/icons/favicon.ico",
  "/icons/favicon-16x16.png",
  "/icons/favicon-32x32.png",
  "/icons/favicon-48x48.png",
  "/icons/favicon-64x64.png",
  "/icons/favicon-128x128.png",
  "/icons/favicon-256x256.png",
  "/icons/favicon-512x512.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME && key !== DYNAMIC_CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.origin !== location.origin) return;

  if (url.pathname.startsWith("/content/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches
            .open(DYNAMIC_CACHE_NAME)
            .then((cache) => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() =>
          caches
            .match(event.request)
            .then((cached) => cached || caches.match("/content/home.html")),
        ),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request)),
  );
});

self.addEventListener("push", (event) => {
  let data = { title: "Новое уведомление", body: "", reminderId: null };
  if (event.data) {
    data = event.data.json();
  }
  const options = {
    body: data.body,
    icon: "/icons/favicon-128x128.png",
    badge: "/icons/favicon-48x48.png",
    data: { reminderId: data.reminderId },
  };

  if (data.reminderId) {
    options.actions = [{ action: "snooze", title: "Отложить на 5 минут" }];
  }

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  const { action, notification } = event;

  if (action === "snooze") {
    const reminderId = notification.data?.reminderId;

    event.waitUntil(
      fetch(`https://localhost:3001/snooze?reminderId=${reminderId}`, {
        method: "POST",
      })
        .then(() => notification.close())
        .catch((error) => {
          console.error("Snooze failed:", error);
          notification.close();
        }),
    );
    return;
  }

  notification.close();
});
