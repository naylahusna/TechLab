import { fileURLToPath } from 'node:url';
import { prepareEmulatorExport } from './emulator-export.mjs';

// Firebase CLI 13 creates the export directory, but not its missing parent.
const recovered = prepareEmulatorExport(fileURLToPath(new URL('../', import.meta.url)));
if (recovered) console.log(`Data emulator dipulihkan dari ${recovered}. Salinan asal tetap disimpan.`);
