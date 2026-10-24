/** SRS-01: dummy identity selection belongs to SRS-02. */
export type Role = 'praktikan' | 'asisten';

export function isRole(value: unknown): value is Role {
  return value === 'praktikan' || value === 'asisten';
}
