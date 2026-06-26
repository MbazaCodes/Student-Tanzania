import { levelsForSchoolType } from "@/lib/tz-geo";

// The 6 remark categories.
export const DEV_CATEGORIES = [
  { key: "behaviour_remark",  label: "Behaviour Remarks" },
  { key: "exams_remark",      label: "Exams Overall Remarks" },
  { key: "attendance_remark", label: "Attendance Remarks" },
  { key: "social_remark",     label: "Social Remarks" },
  { key: "special_remark",    label: "Special Remarks" },
  { key: "other_remark",      label: "Other Development Remarks" },
] as const;

export type DevKey = (typeof DEV_CATEGORIES)[number]["key"];

export const DEV_TERMS = ["Term 1", "Term 2", "Annual"] as const;

export type DevRecord = {
  id?: string;
  tsid: string;
  school_code: string;
  year: number;
  term: string;
  level?: string | null;
} & Partial<Record<DevKey, string | null>>;

// A record is "complete" only when ALL 6 categories are filled.
export function isRecordComplete(rec: Partial<Record<DevKey, string | null>>): boolean {
  return DEV_CATEGORIES.every((c) => {
    const v = rec[c.key];
    return typeof v === "string" && v.trim().length > 0;
  });
}

export function filledCount(rec: Partial<Record<DevKey, string | null>>): number {
  return DEV_CATEGORIES.filter((c) => {
    const v = rec[c.key];
    return typeof v === "string" && v.trim().length > 0;
  }).length;
}

/**
 * The list of academic YEARS the student must have records for:
 * from their start year (when they began at start_level) up to the current year.
 * Falls back to deriving the span from the class ladder if start_year is absent.
 */
export function requiredYears(opts: {
  startYear?: number | null;
  startLevel?: string | null;
  currentLevel?: string | null;
  schoolType?: string | null;
  enrollmentDate?: string | null;
}): number[] {
  const now = new Date().getFullYear();

  let startYear = opts.startYear ?? null;

  // Derive start year from enrollment date if not explicitly set.
  if (!startYear && opts.enrollmentDate) {
    const y = new Date(opts.enrollmentDate).getFullYear();
    if (!isNaN(y)) startYear = y;
  }

  // Derive from the class ladder: years between start_level and current_level.
  if (!startYear && opts.startLevel && opts.currentLevel) {
    const ladder = levelsForSchoolType(opts.schoolType ?? "Primary School");
    const si = ladder.indexOf(opts.startLevel);
    const ci = ladder.indexOf(opts.currentLevel);
    if (si >= 0 && ci >= si) startYear = now - (ci - si);
  }

  if (!startYear) startYear = now; // last resort: just this year

  const years: number[] = [];
  for (let y = startYear; y <= now; y++) years.push(y);
  return years;
}

/**
 * Progress = fraction of REQUIRED year-records that exist AND are complete.
 * One record per required year counts (term granularity is for detail; a year
 * is satisfied when it has at least one complete record).
 */
export function developmentProgress(records: DevRecord[], years: number[]): {
  percent: number;
  complete: boolean;
  doneYears: number[];
  missingYears: number[];
} {
  if (years.length === 0) return { percent: 0, complete: false, doneYears: [], missingYears: [] };

  const doneYears: number[] = [];
  const missingYears: number[] = [];

  for (const y of years) {
    const yearRecs = records.filter((r) => r.year === y);
    const anyComplete = yearRecs.some((r) => isRecordComplete(r));
    if (anyComplete) doneYears.push(y);
    else missingYears.push(y);
  }

  const percent = Math.round((doneYears.length / years.length) * 100);
  return { percent, complete: percent === 100, doneYears, missingYears };
}
