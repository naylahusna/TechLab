export type MapCenter = { latitude: number; longitude: number };

export const campusCenter: MapCenter = { latitude: -7.0482375, longitude: 110.440765625 };

export function mapDocument({ latitude, longitude }: MapCenter) {
  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="anonymous">
  <style>
    html, body, #map { height: 100%; margin: 0; }
    #status { position: absolute; z-index: 1000; top: 12px; right: 12px;
      max-width: calc(100% - 76px); padding: 8px 12px; border-radius: 6px;
      background: white; color: #172554; font: 14px system-ui, sans-serif; }
  </style>
</head>
<body>
  <div id="map" aria-label="Peta area laboratorium Informatika UNDIP"></div>
  <div id="status" role="status">Memuat peta…</div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin="anonymous"></script>
  <script>
    const status = document.getElementById('status');
    if (!window.L || !window.L.version) {
      status.textContent = 'Peta gagal dimuat. Periksa koneksi internet.';
    } else {
      const map = L.map('map', { minZoom: 3 }).setView([${latitude}, ${longitude}], 17);
      const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>',
        referrerPolicy: 'strict-origin-when-cross-origin',
      });
      tiles.on('tileload', () => { status.hidden = true; });
      tiles.on('tileerror', () => {
        status.textContent = 'Sebagian peta gagal dimuat.';
        status.hidden = false;
      });
      tiles.addTo(map);
    }
  </script>
</body>
</html>`;
}
