export const MAX_IMPORT_BYTES = 512 * 1024;

type RecordLine = { line: number; cells: string[] };

function readRecords(input: string): RecordLine[] {
  const text = input.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const records: RecordLine[] = [];
  let line = 1;
  let start = 1;
  let cells: string[] = [];
  let value = '';
  let state: 'value' | 'quote' | 'closed' = 'value';
  function finishRow() {
    cells.push(value);
    if (cells.some((item) => item.trim())) records.push({ line: start, cells });
    if (records.length > 201) throw new Error('Maksimal 200 baris data per file.');
    cells = [];
    value = '';
    state = 'value';
  }
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (state === 'quote') {
      if (char === '"' && text[index + 1] === '"') {
        value += '"';
        index++;
      } else if (char === '"') {
        state = 'closed';
      } else {
        value += char;
        if (char === '\n') line++;
      }
    } else if (char === ',') {
      cells.push(value);
      value = '';
      state = 'value';
    } else if (char === '\n') {
      finishRow();
      start = ++line;
    } else if (char === '"' && state === 'value' && value === '') {
      state = 'quote';
    } else if (state === 'closed' || char === '"') {
      throw new Error('Format tanda kutip CSV salah pada baris ' + line + '.');
    } else {
      value += char;
    }
  }
  if (state === 'quote') throw new Error('Tanda kutip CSV belum ditutup pada baris ' + start + '.');
  finishRow();
  return records;
}

export type CsvRow = {
  line: number;
  values: Record<string, string>;
  selected: boolean;
  result?: { ok: boolean; message: string };
};

export function parseImportCsv(text: string, headers: readonly string[]): CsvRow[] {
  if (text.length > MAX_IMPORT_BYTES) throw new Error('Ukuran file maksimal 512 KB.');
  const [header, ...rows] = readRecords(text);
  if (!header) throw new Error('File kosong.');
  const keys = header.cells.map((key) => key.trim());
  if (keys.length !== headers.length || new Set(keys).size !== keys.length || !headers.every((key) => keys.includes(key))) {
    throw new Error('Header tidak sesuai template. Unduh template terbaru.');
  }
  if (rows.length === 0) throw new Error('File belum berisi data.');
  return rows.map(({ line, cells }) => {
    if (cells.length > keys.length) throw new Error('Jumlah kolom berlebih pada baris ' + line + '.');
    return { line, selected: true, values: Object.fromEntries(keys.map((key, index) => [key, cells[index]?.trim() ?? ''])) };
  });
}

export function previewCsvRows<T>(
  rows: readonly CsvRow[], validate: (values: CsvRow['values']) => T, identity: (value: T) => string,
) {
  const seen = new Set<string>();
  return rows.map((row) => {
    try {
      const value = validate(row.values);
      const key = identity(value);
      if (seen.has(key)) return { row, error: 'Duplikat dalam file. Ubah identitas atau lewati baris ini.' };
      if (row.selected || row.result?.ok) seen.add(key);
      return { row, value };
    } catch (error) {
      return { row, error: error instanceof Error ? error.message : 'Data baris tidak valid.' };
    }
  });
}
