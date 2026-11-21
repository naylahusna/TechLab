import { mapDocument, type MapCenter } from './map-document';

export function MapViewport({ center }: { center: MapCenter }) {
  return (
    <iframe
      title="Peta laboratorium"
      srcDoc={mapDocument(center)}
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
      style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
    />
  );
}
