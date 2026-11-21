export type MapCenter = { latitude: number; longitude: number };
export type LabMarker = MapCenter & { id: string; name: string };
export type MapState = {
  labs: LabMarker[];
  userLocation: MapCenter | null;
  selectedId: string | null;
  zoomSteps: number;
  focus: (MapCenter & { revision: number }) | null;
};

export type MapViewportProps = {
  state: MapState;
  onSelect: (id: string) => void;
};

export function readMapEvent(value: unknown): { type: 'ready' } | { type: 'select'; id: string } | null {
  if (!value || typeof value !== 'object' || !('type' in value)) return null;
  if (value.type === 'ready') return { type: 'ready' };
  if (value.type === 'select' && 'id' in value && typeof value.id === 'string') {
    return { type: 'select', id: value.id };
  }
  return null;
}
