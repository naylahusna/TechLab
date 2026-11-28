export type LabLocationInput = {
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
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
  const plusCode = input.plusCode.trim();
  if (name.length < 2 || name.length > 100) {
    throw new Error('Isi nama lab sepanjang 2–100 karakter.');
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
  return {
    name, building, plusCode, latitude: input.latitude, longitude: input.longitude,
    radiusMeters: input.radiusMeters, floor: input.floor,
  };
}

export function labHasName(lab: { name: string; previousNames?: readonly string[] }, name: string) {
  const key = normalizeLabName(name);
  return [lab.name, ...(lab.previousNames ?? [])].some((value) => normalizeLabName(value) === key);
}

export function courseLabKey(courseName: string): string {
  return 'course-' + courseName.replace(/%/g, '%25').replace(/\//g, '%2F');
}

export function validateGraceMinutes(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Toleransi harus berupa menit bulat dan minimal 0.');
  return value;
}

export function resolveCourseLabs<T extends { id: string; archivedAt: unknown; legacyCourseName?: string; catalogVersion?: number }>(
  labs: readonly T[], courseName: string, labIds?: readonly string[],
): T[] {
  const ids = labIds && new Set(labIds);
  return labs.filter((lab) => !lab.archivedAt && (ids ? ids.has(lab.id)
    : lab.catalogVersion !== 2 && (!lab.legacyCourseName || lab.legacyCourseName === courseName)));
}

export function selectLabForCourse<T extends { id: string; name: string; legacyCourseName?: string; previousNames?: readonly string[] }>(
  labs: readonly T[], courseName: string, name: string, labId?: string,
): T | undefined {
  if (labId) return labs.find((lab) => lab.id === labId);
  const matches = labs.filter((lab) => labHasName(lab, name));
  const scoped = matches.filter((lab) => lab.legacyCourseName === courseName);
  if (scoped.length === 1) return scoped[0];
  return matches.length === 1 ? matches[0] : undefined;
}
