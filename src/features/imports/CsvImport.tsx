import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActionButton } from '../../components/ActionButton';
import { Text } from '../../components/Text';
import { colors } from '../../theme/tokens';
import { FormField } from '../auth/AuthForm';
import { parseImportCsv, previewCsvRows, type CsvRow } from './csv';
import { chooseCsv, exportCsv } from './files';

export function CsvImport<T>({ title, filename, headers, validate, identity, save, onBusyChange }:  {
  title: string;
  filename: string;
  headers: readonly string[];
  validate: (values: CsvRow['values']) => T;
  identity: (value: T) => string;
  save: (value: T) => Promise<string>;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState('');
  const [editingLine, setEditingLine] = useState<number | null>(null);
  const preview = previewCsvRows(rows, validate, identity);

  async function run(operation: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    onBusyChange?.(true);
    setError('');
    try { await operation(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Impor gagal. Coba lagi.'); }
    finally { setBusy(false); onBusyChange?.(false); }
  }

  async function saveSelected() {
    setEditingLine(null);
    let success = 0;
    let failed = 0;
    for (const item of preview) {
      if (!item.row.selected || item.row.result?.ok || !('value' in item) || item.value === undefined) continue;
      let result: NonNullable<CsvRow['result']>;
      try {
        result = { ok: true, message: await save(item.value) };
        success++;
      } catch (cause) {
        result = { ok: false, message: cause instanceof Error ? cause.message : 'Gagal menyimpan. Coba lagi.' };
        failed++;
      }
      setRows((current) => current.map((row) => row.line === item.row.line ? { ...row, result } : row));
    }
    setSummary(success + ' berhasil · ' + failed + ' gagal. Baris gagal bisa dicoba lagi.');
  }

  return (
    <View style={styles.group}>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      <ActionButton title="Unduh template CSV" secondary disabled={busy} onPress={() => void run(() => exportCsv(filename, headers))} />
      <ActionButton title="Pilih file CSV" secondary disabled={busy} onPress={() => void run(async () => {
        const text = await chooseCsv();
        if (text === undefined) return;
        setRows([]);
        setEditingLine(null);
        setSummary('');
        setRows(parseImportCsv(text, headers));
      })} />
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      {preview.map(({ row, error: rowError }) => (
        <View style={styles.row} key={row.line}>
          <Text style={styles.title}>Baris {row.line} · {row.selected ? 'Dipilih' : 'Dilewati'}</Text>
          {editingLine === row.line ? headers.map((key) => <FormField key={key} label={key} value={row.values[key] ?? ''}
            editable={!busy && !row.result?.ok} onChangeText={(value) => setRows((current) => current.map((item) =>
              item.line === row.line ? { ...item, values: { ...item.values, [key]: value }, result: undefined } : item
            ))} />) : <Text style={styles.status}>{headers.map((key) => row.values[key]).filter(Boolean).join(' · ')}</Text>}
          {!row.result?.ok && <ActionButton title={editingLine === row.line ? 'Tutup editor baris' : 'Edit baris'}
            secondary disabled={busy} onPress={() => setEditingLine(editingLine === row.line ? null : row.line)} />}
          {!!rowError && <Text style={styles.error}>{rowError}</Text>}
          {!!row.result && <Text style={row.result.ok ? styles.status : styles.error}>{row.result.message}</Text>}
          <ActionButton title={row.selected ? 'Lewati baris' : 'Terima baris'} secondary disabled={busy || row.result?.ok}
            onPress={() => setRows((current) => current.map((item) => item.line === row.line ? { ...item, selected: !item.selected } : item))} />
        </View>
      ))}
      {rows.length > 0 && (
        <ActionButton title={busy ? 'Memproses…' : 'Simpan baris valid yang dipilih'}
          disabled={busy || !preview.some(({ row, error: rowError }) => row.selected && !row.result?.ok && !rowError)}
          onPress={() => void run(saveSelected)} />
      )}
      {!!summary && <Text accessibilityLiveRegion="polite" style={styles.status}>{summary}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 12 },
  row: { gap: 8, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 12 },
  title: { color: colors.navy, fontWeight: '800' },
  error: { color: colors.danger },
  status: { color: colors.navy },
});
