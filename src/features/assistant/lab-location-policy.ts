export type LabLocationInput = {
  courseName: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  graceMinutes: number;
  building: string;
  floor: number | null;
  plusCode: string;
};

export function normalizeLabName(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('id');
}

export function validateLabLocation(input: LabLocationInput): LabLocationInput {
  const name = input.name.trim().replace(/\s+/g, ' ');
  const building = input.building.trim().replace(/\s+/g, ' ');
  const courseName = input.courseName.trim();
  const plusCode = input.plusCode.trim();
  if (name.length < 2 || name.length > 100 || !courseName || courseName.length > 100) {
    throw new Error('Pilih mata kuliah dan isi nama lab sepanjang 2–100 karakter.');
  }
  if (!building || building.length > 120 || plusCode.length > 20 || (input.floor !== null && !Number.isSafeInteger(input.floor))) {
    throw new Error('Periksa gedung, lantai, dan Plus Code lab.');
  }
  if (!Number.isFinite(input.latitude) || Math.abs(input.latitude) > 90
    || !Number.isFinite(input.longitude) || Math.abs(input.longitude) > 180) {
    throw new Error('Latitude harus −90 sampai 90 dan longitude −180 sampai 180.');
  }
  if (!Number.isFinite(input.radiusMeters) || input.radiusMeters < 1 || input.radiusMeters > 5000) {
    throw new Error('Radius harus antara 1 dan 5000 meter.');
  }
  if (!Number.isSafeInteger(input.graceMinutes) || input.graceMinutes < 0) {
    throw new Error('Toleransi harus berupa menit bulat dan minimal 0.');
  }
  return { ...input, courseName, name, building, plusCode };
}

export function labHasName(lab: { name: string; previousNames?: readonly string[] }, name: string) {
  const key = normalizeLabName(name);
  return [lab.name, ...(lab.previousNames ?? [])].some((value) => normalizeLabName(value) === key);
}

export function selectLabForCourse<T extends { name: string; courseName: string; previousNames?: readonly string[] }>(
  labs: readonly T[], courseName: string, name: string,
): T | undefined {
  const matches = labs.filter((lab) => labHasName(lab, name));
  return matches.find((lab) => lab.courseName === courseName) ?? matches.find((lab) => !lab.courseName);
}
