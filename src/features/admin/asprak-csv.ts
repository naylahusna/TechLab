export const asprakCsvHeaders = ['nim_asprak'] as const;

export function parseAsprakRow(values: Record<string, string>) {
  const number = values.nim_asprak?.trim() ?? '';
  if (!/^[A-Za-z0-9.-]{1,32}$/.test(number)) throw new Error('Isi NIM Asprak aktif.');
  return number;
}
