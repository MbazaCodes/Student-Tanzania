import { levelsForSchoolType } from "@/lib/tz-geo";

// The 6 remark categories.
export const DEV_CATEGORIES = [
  { key: "behaviour",  label: "Behaviour Remarks",        detail: "behaviour_detail" },
  { key: "exams",      label: "Exams Overall Remarks",    detail: "exams_detail" },
  { key: "attendance", label: "Attendance Remarks",       detail: "attendance_detail" },
  { key: "social",     label: "Social Remarks",           detail: "social_detail" },
  { key: "special",    label: "Special Remarks",          detail: "special_detail" },
  { key: "other",      label: "Other Development Remarks", detail: "other_detail" },
] as const;

export type DevCatKey = (typeof DEV_CATEGORIES)[number]["key"];

// Rating dropdown for each category. Each maps to a default score.
export const DEV_RATINGS = [
  { value: "Excellent",        score: 100 },
  { value: "Very Good",        score: 85 },
  { value: "Good",             score: 75 },
  { value: "Satisfactory",     score: 60 },
  { value: "Needs Improvement", score: 45 },
  { value: "Poor",             score: 25 },
  { value: "Concern",          score: 10 },
] as const;

export function scoreForRating(rating?: string | null): number {
  return DEV_RATINGS.find((r) => r.value === rating)?.score ?? 0;
}

export type CategoryDetail = { rating?: string; score?: number; comment?: string };

// Talent areas a student can be identified with.
export const TALENT_AREAS = [
  "Football / Soccer", "Athletics", "Basketball", "Netball", "Other Sports",
  "Science & Innovation", "Mathematics", "Technology / Coding", "Engineering",
  "Music", "Visual Arts", "Drama / Theatre", "Creative Writing", "Public Speaking / Debate",
  "Leadership", "Entrepreneurship", "Agriculture", "Languages", "Other",
] as const;

export const DEV_TERMS = ["Term 1", "Term 2", "Annual"] as const;

// Lifetime education ladder — nursery → university. Used for span tracking
// across a student's whole journey, regardless of current school type.
export const LIFETIME_LADDER = [
  "Baby Class", "Middle Class", "Pre-Unit (Reception)",
  "Standard 1", "Standard 2", "Standard 3", "Standard 4", "Standard 5", "Standard 6", "Standard 7",
  "Form 1", "Form 2", "Form 3", "Form 4", "Form 5", "Form 6",
  "Certificate", "Diploma",
  "University Year 1", "University Year 2", "University Year 3", "University Year 4", "University Year 5",
  "Postgraduate",
];

export type DevRecord = {
  id?: string;
  tsid: string;
  school_code: string;
  year: number;
  term: string;
  level?: string | null;
  talent_area?: string | null;
  talent_remark?: string | null;
} & Partial<Record<`${DevCatKey}_detail`, CategoryDetail>>;

// A record is "complete" only when ALL 6 categories have a rating + comment.
export function isRecordComplete(rec: any): boolean {
  return DEV_CATEGORIES.every((c) => {
    const d: CategoryDetail = rec[c.detail] ?? {};
    return !!d.rating && typeof d.comment === "string" && d.comment.trim().length > 0;
  });
}

export function filledCount(rec: any): number {
  return DEV_CATEGORIES.filter((c) => {
    const d: CategoryDetail = rec[c.detail] ?? {};
    return !!d.rating && typeof d.comment === "string" && d.comment.trim().length > 0;
  }).length;
}

// Average score across the 6 categories for a record.
export function recordScore(rec: any): number {
  const scores = DEV_CATEGORIES.map((c) => {
    const d: CategoryDetail = rec[c.detail] ?? {};
    return typeof d.score === "number" ? d.score : scoreForRating(d.rating);
  });
  const valid = scores.filter((s) => s > 0);
  if (valid.length === 0) return 0;
  return Math.round(valid.reduce((a, b) => a + b, 0) / DEV_CATEGORIES.length);
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

  // Derive from the lifetime ladder: years between start_level and current_level.
  if (!startYear && opts.startLevel && opts.currentLevel) {
    const si = LIFETIME_LADDER.indexOf(opts.startLevel);
    const ci = LIFETIME_LADDER.indexOf(opts.currentLevel);
    if (si >= 0 && ci >= si) startYear = now - (ci - si);
    else {
      // fall back to the school-type ladder
      const ladder = levelsForSchoolType(opts.schoolType ?? "Primary School");
      const s2 = ladder.indexOf(opts.startLevel), c2 = ladder.indexOf(opts.currentLevel);
      if (s2 >= 0 && c2 >= s2) startYear = now - (c2 - s2);
    }
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
  avgScore: number;
} {
  if (years.length === 0) return { percent: 0, complete: false, doneYears: [], missingYears: [], avgScore: 0 };

  const doneYears: number[] = [];
  const missingYears: number[] = [];
  const yearScores: number[] = [];

  for (const y of years) {
    const yearRecs = records.filter((r) => r.year === y);
    const complete = yearRecs.filter((r) => isRecordComplete(r));
    if (complete.length > 0) {
      doneYears.push(y);
      // best complete record's score for the year
      yearScores.push(Math.max(...complete.map((r) => recordScore(r))));
    } else {
      missingYears.push(y);
    }
  }

  // Completion percent (every required year complete = 100%)
  const percent = Math.round((doneYears.length / years.length) * 100);
  // Average development score across completed years (quality, not just presence)
  const avgScore = yearScores.length ? Math.round(yearScores.reduce((a, b) => a + b, 0) / yearScores.length) : 0;
  return { percent, complete: percent === 100, doneYears, missingYears, avgScore };
}
