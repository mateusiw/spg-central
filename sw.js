// Service worker da Central de Sites.
// Guarda só os arquivos do próprio app (página, manifest e ícones) para abrir rápido.
// Os dados da planilha (Apps Script) e os sites abertos nas abas sempre vêm da rede.
// Ícones e manifest ficam embutidos no index.html, então só a página precisa ser guardada.
const CACHE = 'spg-central-v3';
const ARQUIVOS = ['./', './index.html'];

self.addEventListener('install', event => {
    // Se algum arquivo faltar no servidor, não impede o service worker de instalar.
    event.waitUntil(caches.open(CACHE).then(c =>
        Promise.all(ARQUIVOS.map(a => c.add(a).catch(() => console.warn('Não encontrado:', a))))
    ));
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(chaves =>
            Promise.all(chaves.filter(k => k !== CACHE).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

    // Rede primeiro (para sempre pegar a versão nova); cache como reserva offline.
    event.respondWith(
        fetch(req)
            .then(resp => {
                if (resp.ok) {
                    const copia = resp.clone();
                    caches.open(CACHE).then(c => c.put(req, copia));
                }
                return resp;
            })
            .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
});
