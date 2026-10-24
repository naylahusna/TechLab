import type { Role } from './roles';

export type DemoUser = Readonly<{
  id: string;
  name: string;
  role: Role;
  number: string;
  group: string;
  initials: string;
}>;

/** Fictional identities, shared by all screens. No authentication is performed. */
const seedUsers: DemoUser[] = [
  {
    id: 'praktikan-01',
    name: 'Alya Putri',
    role: 'praktikan',
    number: '240101001',
    group: 'Informatika · Kelas A',
    initials: 'AP',
  },
  {
    id: 'praktikan-02',
    name: 'Bima Pratama',
    role: 'praktikan',
    number: '240101002',
    group: 'Informatika · Kelas A',
    initials: 'BP',
  },
  {
    id: 'praktikan-03',
    name: 'Citra Larasati',
    role: 'praktikan',
    number: '240101003',
    group: 'Informatika · Kelas B',
    initials: 'CL',
  },
  {
    id: 'asisten-01',
    name: 'Dimas Aditya',
    role: 'asisten',
    number: 'AS-001',
    group: 'Asisten · Lab Komputasi',
    initials: 'DA',
  },
  {
    id: 'asisten-02',
    name: 'Nadia Safitri',
    role: 'asisten',
    number: 'AS-002',
    group: 'Asisten · Lab Komputasi',
    initials: 'NS',
  },
];

export const users: readonly DemoUser[] = Object.freeze(
  seedUsers.map((user) => Object.freeze(user)),
);

export function usersForRole(role: Role) {
  return users.filter((user) => user.role === role);
}

export function findUser(userId: string | null) {
  return users.find((user) => user.id === userId) ?? null;
}
