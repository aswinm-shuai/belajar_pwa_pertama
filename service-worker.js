// ================================================================
// sw.js – Subflow Service Worker (Production Ready 2025)
// Letakkan di: /belajar_pwa_pertama/sw.js
// ================================================================

const CACHE_VERSION = "pwa-template-v2";
const OFFLINE_URL   = "offline.html";

const PRECACHE_ASSETS = [
  "/belajar_pwa_pertama/",
  "/belajar_pwa_pertama/index.html",
  "/belajar_pwa_pertama/offline.html",
  "/belajar_pwa_pertama/style.css",
  "/belajar_pwa_pertama/app.js",
  "/belajar_pwa_pertama/manifest.json",
  "/belajar_pwa_pertama/icons/logo subflow 192x192.png",
  "/belajar_pwa_pertama/icons/logo subflow 512x512.png",
];

// ── INSTALL ──────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.addAll(PRECACHE_ASSETS)
    ).catch((err) => console.warn("[SW] Precache gagal (sebagian):", err))
  );
});

// ── ACTIVATE ─────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Hapus semua cache versi lama
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== CACHE_VERSION && k !== "subflow-sync-queue")
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// ── FETCH – Network-First + Offline Fallback ──────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip: bukan GET, chrome-extension, firebase, analytics
  if (request.method !== "GET") return;
  if (url.protocol.startsWith("chrome-extension")) return;
  if (url.hostname.includes("firebaseapp.com"))    return;
  if (url.hostname.includes("googleapis.com"))     return;
  if (url.hostname.includes("gstatic.com"))        return;
  if (url.hostname.includes("google-analytics"))   return;

  event.respondWith(
    (async () => {
      try {
        const networkRes = await fetch(request);
        if (networkRes && networkRes.status === 200 && networkRes.type !== "opaque") {
          const cache = await caches.open(CACHE_VERSION);
          cache.put(request, networkRes.clone());
        }
        return networkRes;
      } catch {
        const cached = await caches.match(request);
        if (cached) return cached;

        if (request.mode === "navigate") {
          const offline = await caches.match(OFFLINE_URL);
          if (offline) return offline;
        }

        return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
      }
    })()
  );
});

// ── PUSH NOTIFICATION ────────────────────────────────────────────
self.addEventListener("push", (event) => {
  // Default payload jika kosong
  let payload = {
    title: "Subflow",
    body:  "Ada update baru di Subflow kamu.",
    icon:  "/belajar_pwa_pertama/icons/logo subflow 192x192.png",
    badge: "/belajar_pwa_pertama/icons/logo subflow 192x192.png",
    url:   "/belajar_pwa_pertama/index.html",
    tag:   "subflow-push",
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    } catch {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body:     payload.body,
      icon:     payload.icon,
      badge:    payload.badge,
      tag:      payload.tag,
      renotify: true,
      vibrate:  [200, 100, 200],
      data:     { url: payload.url },
      actions: [
        { action: "open",    title: "Buka Aplikasi" },
        { action: "dismiss", title: "Tutup"          },
      ],
    })
  );
});

// ── NOTIFICATION CLICK ───────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const targetUrl = event.notification.data?.url || "/belajar_pwa_pertama/index.html";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // Focus tab yang sudah ada
      for (const client of allClients) {
        if (client.url.includes("/belajar_pwa_pertama") && "focus" in client) {
          await client.navigate(targetUrl);
          await client.focus();
          return;
        }
      }

      // Buka tab baru
      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })()
  );
});

// ── BACKGROUND SYNC ──────────────────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-pending-data") {
    event.waitUntil(processSyncQueue());
  }
});

async function processSyncQueue() {
  const cache    = await caches.open("subflow-sync-queue");
  const requests = await cache.keys();

  for (const req of requests) {
    const cached = await cache.match(req);
    if (!cached) continue;

    let data;
    try { data = await cached.json(); } catch { continue; }

    try {
      const res = await fetch(data.url, {
        method:  data.method || "POST",
        headers: { "Content-Type": "application/json" },
        body:    data.body ? JSON.stringify(data.body) : undefined,
      });

      if (res.ok) {
        await cache.delete(req);
        console.log("[SW] Sync berhasil:", data.url);
      } else {
        throw new Error(`Server error: ${res.status}`);
      }
    } catch (err) {
      console.warn("[SW] Sync gagal, akan dicoba ulang:", err.message);
      // Re-throw agar browser otomatis retry saat online
      throw err;
    }
  }
}

// ── PERIODIC BACKGROUND SYNC ─────────────────────────────────────
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "update-subflow-data") {
    event.waitUntil(fetchAndCacheLatestData());
  }
});

async function fetchAndCacheLatestData() {
  try {
    // Coba fetch data terbaru — ganti URL ini dengan endpoint nyata kamu
    // Sementara fetch manifest sebagai "data" yang valid
    const res = await fetch("/belajar_pwa_pertama/manifest.json", {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const cache = await caches.open(CACHE_VERSION);
    await cache.put("/belajar_pwa_pertama/manifest.json", res.clone());

    console.log("[SW] Periodic sync selesai:", new Date().toISOString());
  } catch (err) {
    console.warn("[SW] Periodic sync gagal:", err.message);
  }
}

// ── MESSAGE HANDLER (untuk komunikasi dari halaman) ───────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
