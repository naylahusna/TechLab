export const practitionerCsvHeaders = ['nim_praktikan'] as const;

export function parsePractitionerRow(values: Record<string, string>) {
  const number = values.nim_praktikan?.trim() ?? '';
  if (!/^[A-Za-z0-9.-]{1,32}$/.test(number)) throw new Error('Isi NIM Praktikan yang terdaftar.');
  return number;
}
