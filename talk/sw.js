// Service worker for "I Can Talk"
// Pages: always fetched fresh when online (so updates show on a normal reload), saved copy when offline.
// Her pictures, videos and sounds: all saved on this device ahead of time, so the whole board,
// animal videos included, works with no internet.
const CACHE = 'ble-talk-v5';
const PAGES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
const MEDIA = [
  "./animals/bear.mp4",
  "./animals/bear.png",
  "./animals/bee.mp4",
  "./animals/bee.png",
  "./animals/bird.mp4",
  "./animals/bird.png",
  "./animals/cat.mp4",
  "./animals/cat.png",
  "./animals/chicken.mp4",
  "./animals/chicken.png",
  "./animals/cow.mp4",
  "./animals/cow.png",
  "./animals/dog.mp4",
  "./animals/dog.png",
  "./animals/duck.mp4",
  "./animals/duck.png",
  "./animals/elephant.mp4",
  "./animals/elephant.png",
  "./animals/fish.mp4",
  "./animals/fish.png",
  "./animals/frog.mp4",
  "./animals/frog.png",
  "./animals/giraffe.mp4",
  "./animals/giraffe.png",
  "./animals/goat.mp4",
  "./animals/goat.png",
  "./animals/horse.mp4",
  "./animals/horse.png",
  "./animals/lion.mp4",
  "./animals/lion.png",
  "./animals/lizard.mp4",
  "./animals/lizard.png",
  "./animals/monkey.mp4",
  "./animals/monkey.png",
  "./animals/owl.mp4",
  "./animals/owl.png",
  "./animals/pig.mp4",
  "./animals/pig.png",
  "./animals/rabbit.mp4",
  "./animals/rabbit.png",
  "./animals/sheep.mp4",
  "./animals/sheep.png",
  "./animals/snake.mp4",
  "./animals/snake.png",
  "./animals/squirrel.mp4",
  "./animals/squirrel.png",
  "./sounds/monkey.mp3",
  "./sounds/sheep.mp3",
  "./sounds/snake.mp3"
];
const isMedia = url => /\/(animals|sounds)\//.test(new URL(url).pathname) || /\.(mp4|webm|m4v|mp3|m4a|wav)(\?|$)/i.test(new URL(url).pathname);

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => Promise.all(
      PAGES.concat(MEDIA).map(u => fetch(new Request(u, { cache: 'reload' })).then(r => r.ok ? c.put(u, r) : null).catch(() => {}))
    )).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('ble-talk') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// A video asks for itself in pieces ("Range" requests). Answer each piece from the saved copy.
async function fromSaved(req) {
  const c = await caches.open(CACHE);
  const url = req.url.split('#')[0];
  let full = await c.match(url, { ignoreSearch: true });
  if (!full) {
    full = await fetch(url, { cache: 'reload' });            // not saved yet: fetch the whole file once
    if (full.ok && full.status === 200) await c.put(url, full.clone());
  }
  const range = req.headers.get('range');
  if (!range || !full.ok) return full;
  const buf = await full.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(range) || [];
  let start = m[1] ? parseInt(m[1], 10) : 0;
  let end = m[2] ? parseInt(m[2], 10) : buf.byteLength - 1;
  if (!m[1] && m[2]) { start = Math.max(0, buf.byteLength - parseInt(m[2], 10)); end = buf.byteLength - 1; }
  end = Math.min(end, buf.byteLength - 1);
  if (start >= buf.byteLength) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + buf.byteLength } });
  return new Response(buf.slice(start, end + 1), {
    status: 206, statusText: 'Partial Content',
    headers: {
      'Content-Type': full.headers.get('Content-Type') || 'video/mp4',
      'Content-Range': 'bytes ' + start + '-' + end + '/' + buf.byteLength,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes'
    }
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;
  if (isMedia(req.url)) { e.respondWith(fromSaved(req)); return; }
  e.respondWith(
    fetch(req, { cache: 'no-store' })          // always try the network, no HTTP cache
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then(m => m || caches.match('./index.html')))  // offline fallback
  );
});
