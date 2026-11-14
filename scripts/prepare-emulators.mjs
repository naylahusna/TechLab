import { mkdirSync } from 'node:fs';

// Firebase CLI 13 creates the export directory, but not its missing parent.
mkdirSync(new URL('../.firebase/', import.meta.url), { recursive: true });
