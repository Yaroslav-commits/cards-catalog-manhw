// Название хранилища (при обновлении версий картинок меняй v1 на v2 и т.д.)
const CACHE_NAME = 'manhwcard-cache-v1';

// Основные файлы для мгновенной предзагрузки
const STATIC_ASSETS = [
    './',
    './index.html',
    './cards.json',
    './images/default.webp'
];

// 1. Установка Service Worker и предзагрузка базы
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Предварительное кэширование ресурсов');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// 2. Активация и очистка устаревшего кэша при обновлении версии
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[SW] Удаление старого кэша:', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// 3. Перехват запросов (Стратегия: Cache First для медиафайлов)
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // Проверяем, относится ли запрос к картинкам, видео или файлу карт
    const isMediaOrData =
        url.pathname.includes('/images/') ||
        url.pathname.endsWith('.webp') ||
        url.pathname.endsWith('.webm') ||
        url.pathname.endsWith('.json') ||
        url.pathname.endsWith('.png');

    if (isMediaOrData && request.method === 'GET') {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(request).then((cachedResponse) => {
                    // Если файл уже есть в локальном сейфе — отдаём мгновенно!
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    // Если файла нет в сейфе — скачиваем с сервера и кэшируем на будущее
                    return fetch(request).then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            cache.put(request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(() => {
                        // Если пропал интернет и картинка не найдена — отдаём дефолтную
                        if (url.pathname.endsWith('.webp')) {
                            return cache.match('./images/default.webp');
                        }
                    });
                });
            })
        );
        return;
    }

    // Для остальных запросов используем стандартный сетевой запрос
    event.respondWith(
        fetch(request).catch(() => caches.match(request))
    );
});