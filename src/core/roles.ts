/** SRS-01: dummy identity selection belongs to SRS-02. */
export type Role = 'praktikan' | 'asisten' | 'admin';

export const roleLabels: Record<Role, string> = {
  praktikan: 'Praktikan',
  asisten: 'Asisten',
  admin: 'Admin Lab',
};

export function isRole(value: unknown): value is Role {
  return value === 'praktikan' || value === 'asisten' || value === 'admin';
}
