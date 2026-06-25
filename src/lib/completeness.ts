// Profile completeness scoring for students and schools.

export type CompletenessResult = {
  percent: number;          // 0-100
  complete: boolean;        // percent === 100
  missing: string[];        // human-readable missing field labels
  missingKeys: string[];    // raw field keys
};

// Fields required for a "complete" student profile (used on ID cards & letters)
const STUDENT_REQUIRED: { key: string; label: string }[] = [
  { key: "fullname", label: "Full Name" },
  { key: "dob", label: "Date of Birth" },
  { key: "gender", label: "Gender" },
  { key: "level", label: "Current Level" },
  { key: "photo", label: "Profile Photo" },
  { key: "blood_group", label: "Blood Group" },
  { key: "nationality", label: "Nationality" },
  { key: "school_name", label: "School" },
  { key: "region", label: "Region" },
  { key: "district", label: "District" },
  { key: "parent_name", label: "Parent / Guardian" },
  { key: "parent_phone", label: "Parent Phone" },
  { key: "relationship", label: "Relationship" },
  { key: "enrollment_date", label: "Enrollment Date" },
];

const SCHOOL_REQUIRED: { key: string; label: string }[] = [
  { key: "school_name", label: "School Name" },
  { key: "type", label: "Institution Type" },
  { key: "region", label: "Region" },
  { key: "district", label: "District" },
  { key: "ward", label: "Ward" },
  { key: "address", label: "Address" },
  { key: "phone", label: "Contact Phone" },
  { key: "email", label: "Contact Email" },
  { key: "logo", label: "School Logo / Photo" },
];

function score(obj: Record<string, unknown> | null | undefined, required: { key: string; label: string }[]): CompletenessResult {
  if (!obj) return { percent: 0, complete: false, missing: required.map((r) => r.label), missingKeys: required.map((r) => r.key) };
  const missing: string[] = [];
  const missingKeys: string[] = [];
  for (const r of required) {
    const v = obj[r.key];
    const empty = v === null || v === undefined || (typeof v === "string" && v.trim() === "");
    if (empty) { missing.push(r.label); missingKeys.push(r.key); }
  }
  const filled = required.length - missing.length;
  const percent = Math.round((filled / required.length) * 100);
  return { percent, complete: percent === 100, missing, missingKeys };
}

export function studentCompleteness(student: Record<string, unknown> | null | undefined): CompletenessResult {
  return score(student, STUDENT_REQUIRED);
}

export function schoolCompleteness(school: Record<string, unknown> | null | undefined): CompletenessResult {
  return score(school, SCHOOL_REQUIRED);
}
