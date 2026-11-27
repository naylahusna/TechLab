export type RestrictedRole = 'calon_asprak' | 'asprak_ditolak' | 'asprak_dicabut';
// Persisted role codes: admin = Aslab, asisten = Asprak, praktikan = Praktikan.
export type Role = 'praktikan' | 'asisten' | 'admin' | RestrictedRole;

export const applicationStatusLabels: Record<RestrictedRole, string> = {
  calon_asprak: 'Menunggu persetujuan Aslab',
  asprak_ditolak: 'Pengajuan asprak ditolak',
  asprak_dicabut: 'Akses asprak dicabut',
};

export const roleLabels: Record<Role, string> = {
  praktikan: 'Praktikan',
  asisten: 'Asprak',
  admin: 'Aslab',
  ...applicationStatusLabels,
};

export function isRestrictedRole(role: Role): role is RestrictedRole {
  return role === 'calon_asprak' || role === 'asprak_ditolak' || role === 'asprak_dicabut';
}

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(roleLabels, value);
}
