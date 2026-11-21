import { useEffect, useRef } from 'react';

import { mapDocument } from './map-document';
import { readMapEvent, type MapViewportProps } from './map-viewport-model';

const html = mapDocument();

export function MapViewport({ state, onSelect }: MapViewportProps) {
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const viewport = frame.current?.contentWindow;
    const send = () => viewport?.postMessage({ type: 'techlab-map/update', state }, '*');
    const receive = (event: MessageEvent) => {
      if (event.source !== viewport || event.origin !== 'null') return;
      const message = readMapEvent(event.data);
      if (message?.type === 'ready') send();
      if (message?.type === 'select') onSelect(message.id);
    };
    window.addEventListener('message', receive);
    send();
    return () => window.removeEventListener('message', receive);
  }, [state, onSelect]);

  return (
    <iframe
      ref={frame}
      title="Peta laboratorium"
      srcDoc={html}
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
      style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
    />
  );
}
