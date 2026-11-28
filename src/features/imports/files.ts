import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { MAX_IMPORT_BYTES } from './csv';

export async function chooseCsv(): Promise<string | undefined> {
  const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (result.canceled) return;
  const asset = result.assets[0];
  if (!asset.name.toLowerCase().endsWith('.csv')) throw new Error('Pilih file CSV sesuai template.');
  const file = Platform.OS === 'web' ? asset.file : undefined;
  const size = file?.size ?? asset.size;
  if (size !== undefined && size > MAX_IMPORT_BYTES) throw new Error('Ukuran file maksimal 512 KB.');
  if (file) return file.text();
  if (Platform.OS === 'web') return (await fetch(asset.uri)).text();
  const info = await FileSystem.getInfoAsync(asset.uri);
  if (!info.exists || info.isDirectory || info.size > MAX_IMPORT_BYTES) throw new Error('File tidak tersedia atau melebihi 512 KB.');
  return FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
}

export async function exportCsv(filename: string, headers: readonly string[]) {
  const content = '\uFEFF' + headers.join(',') + '\r\n';
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  if (!FileSystem.cacheDirectory || !(await Sharing.isAvailableAsync())) throw new Error('Penyimpanan template tidak tersedia.');
  const path = FileSystem.cacheDirectory + filename;
  await FileSystem.writeAsStringAsync(path, content, { encoding: FileSystem.EncodingType.UTF8 });
  await Sharing.shareAsync(path, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text', dialogTitle: 'Simpan template CSV' });
}
