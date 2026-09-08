const CACHE_NAME = 'ayurdhara-cache-v1';

// കാഷെ ചെയ്യേണ്ട ഫയലുകൾ
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './ayurdhara_2.xlsx',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js',
  'https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&family=Outfit:wght@300;400;500;600;700;800&display=swap'
];

// ഇൻസ്റ്റാൾ ചെയ്യുമ്പോൾ ഫയലുകൾ കാഷെയിലേക്ക് മാറ്റുന്നു
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// പുതിയ വേർഷൻ വരുമ്പോൾ പഴയ കാഷെ നീക്കം ചെയ്യുന്നു
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// നെറ്റ്‌വർക്ക് അല്ലെങ്കിൽ കാഷെയിൽ നിന്ന് റിക്വസ്റ്റുകൾ നൽകുന്നു (Network First, Cache Fallback)
self.addEventListener('fetch', (event) => {
  // എക്സ്റ്റേണൽ API / Visitor Counter കാഷെ ചെയ്യാതിരിക്കാൻ
  if (event.request.url.includes('workers.dev')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // കിട്ടിയ പുതിയ ഫയൽ കാഷെയിലേക്ക് അപ്ഡേറ്റ് ചെയ്യുന്നു
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});