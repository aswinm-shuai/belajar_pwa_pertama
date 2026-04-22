// ============================================================
// sw.js - Subflow PWA Service Worker (Production Ready 2025)
// ============================================================

const CACHE_NAME = "subflow-v3";
const OFFLINE_URL = "/offline.html";

const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/assets/style.css",
  "/manifest.json",
  "/icons/logo subflow 192x192.png",
  "/icons/logo subflow 512x512.png",
];

// ─── INSTALL ────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .catch((err) => console.warn("[SW] Precache gagal:", err))
  );
});

// ─── ACTIVATE ───────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Hapus cache lama
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );

      // Ambil kontrol halaman sekarang
      await self.clients.claim();
    })()
  );
});

// ─── FETCH (Network-First + Offline Fallback) ────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Abaikan non-GET dan chrome-extension
  if (request.method !== "GET") return;
  if (url.protocol.startsWith("chrome-extension")) return;

  // Abaikan request analytics / tracking
  if (url.hostname.includes("google-analytics") || url.hostname.includes("doubleclick")) return;

  event.respondWith(
    (async () => {
      try {
        // Network-first: coba jaringan dulu
        const networkResponse = await fetch(request);

        // Simpan response ke cache jika berhasil
        if (networkResponse && networkResponse.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
        }

        return networkResponse;
      } catch {
        // Jaringan gagal: cek cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;

        // Fallback ke offline.html untuk navigasi
        if (request.mode === "navigate") {
          const offlineResponse = await caches.match(OFFLINE_URL);
          if (offlineResponse) return offlineResponse;
        }

        // Fallback terakhir: response kosong
        return new Response("", { status: 408, statusText: "Offline" });
      }
    })()
  );
});

// ─── PUSH NOTIFICATION ──────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = {
    title: "Subflow",
    body: "Ada notifikasi baru dari Subflow.",
    icon: "/icons/logo subflow 192x192.png",
    badge: "/icons/logo subflow 192x192.png",
    url: "/index.html",
  };

  // Support payload JSON dari server
  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      data: { url: data.url },
      vibrate: [200, 100, 200],
      tag: "subflow-notification",
      renotify: true,
    })
  );
});

// ─── NOTIFICATION CLICK ─────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/index.html";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // Focus tab yang sudah ada jika URL cocok
      for (const client of allClients) {
        if (client.url.includes(self.registration.scope) && "focus" in client) {
          await client.focus();
          return;
        }
      }

      // Buka tab baru jika tidak ada yang cocok
      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })()
  );
});

// ─── BACKGROUND SYNC ────────────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-pending-data") {
    event.waitUntil(syncPendingData());
  }
});

async function syncPendingData() {
  try {
    // Baca data pending dari IndexedDB atau cache
    const pendingRequests = await getPendingRequests();

    for (const req of pendingRequests) {
      try {
        const response = await fetch(req.url, {
          method: req.method || "POST",
          headers: req.headers || { "Content-Type": "application/json" },
          body: req.body ? JSON.stringify(req.body) : undefined,
        });

        if (response.ok) {
          await removePendingRequest(req.id);
          console.log("[SW] Background sync berhasil:", req.url);
        } else {
          console.warn("[SW] Background sync gagal (server error):", req.url);
        }
      } catch (err) {
        console.warn("[SW] Background sync gagal (network):", err);
        // Biarkan tetap di queue untuk retry otomatis
        throw err;
      }
    }
  } catch (err) {
    console.warn("[SW] syncPendingData error:", err);
    throw err; // Re-throw agar browser retry
  }
}

// Helper: ambil pending requests dari cache storage
async function getPendingRequests() {
  try {
    const cache = await caches.open("subflow-sync-queue");
    const keys = await cache.keys();
    const requests = [];
    for (const key of keys) {
      const response = await cache.match(key);
      if (response) {
        const data = await response.json();
        requests.push(data);
      }
    }
    return requests;
  } catch {
    return [];
  }
}

// Helper: hapus pending request dari queue
async function removePendingRequest(id) {
  try {
    const cache = await caches.open("subflow-sync-queue");
    await cache.delete(`/sync-queue/${id}`);
  } catch (err) {
    console.warn("[SW] Gagal hapus pending request:", err);
  }
}

// ─── PERIODIC BACKGROUND SYNC ───────────────────────────────
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "update-subflow-data") {
    event.waitUntil(fetchLatestData());
  }
});

async function fetchLatestData() {
  try {
    // Fetch data terbaru dari API (ganti URL sesuai endpoint kamu)
    const response = await fetch("/api/sync/latest", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

    const data = await response.json();

    // Simpan ke cache agar tersedia offline
    const cache = await caches.open(CACHE_NAME);
    await cache.put(
      "/api/sync/latest",
      new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      })
    );

    console.log("[SW] Periodic sync selesai, data diperbarui.");
  } catch (err) {
    console.warn("[SW] Periodic sync gagal:", err);
  }
}
