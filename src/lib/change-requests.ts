import { supabase } from "@/integrations/supabase/client";

// ── Field severity classification ──────────────────────────────────────────
// MAJOR student fields → admin approval
export const STUDENT_MAJOR_FIELDS = ["fullname", "dob", "tsid", "school_code"];
// MINOR student fields → school approval
export const STUDENT_MINOR_FIELDS = [
  "photo", "parent_phone", "address", "parent_name",
  "parent_nida", "relationship", "blood_group",
  "ethnicity", "religion", "disability", "health_condition",
  "allergies", "home_address", "emergency_contact_name", "emergency_contact_phone",
  "start_level", "start_year",
  "idx_std4", "idx_std6", "idx_std7", "idx_form2", "idx_form4", "idx_form6",
  "idx_college", "idx_university", "idx_vocational",
];

export type FieldChange = { old: unknown; new: unknown };
export type ChangeSet = Record<string, FieldChange>;

/** Split a changeset into major (admin) and minor (school) buckets. */
export function classifyStudentChanges(changes: ChangeSet) {
  const major: ChangeSet = {};
  const minor: ChangeSet = {};
  for (const [field, val] of Object.entries(changes)) {
    if (STUDENT_MAJOR_FIELDS.includes(field)) major[field] = val;
    else minor[field] = val;
  }
  return { major, minor };
}

/** Build a changeset by diffing original vs edited objects over given fields. */
export function diffFields<T extends Record<string, unknown>>(
  original: T, edited: T, fields: string[],
): ChangeSet {
  const changes: ChangeSet = {};
  for (const f of fields) {
    const o = original[f] ?? null;
    const n = edited[f] ?? null;
    if (String(o ?? "") !== String(n ?? "")) {
      changes[f] = { old: o, new: n };
    }
  }
  return changes;
}

interface SubmitArgs {
  entity: "student" | "school";
  entity_ref: string;
  entity_name: string;
  severity: "major" | "minor";
  approver_level: "admin" | "school";
  changes: ChangeSet;
  requested_by: string;
  requested_by_name: string;
  requested_by_role: string;
  region?: string | null;
  district?: string | null;
  school_code?: string | null;
}

/** Insert a change request row. */
export async function submitChangeRequest(args: SubmitArgs) {
  const { error } = await supabase.from("change_requests").insert({
    entity: args.entity,
    entity_ref: args.entity_ref,
    entity_name: args.entity_name,
    severity: args.severity,
    approver_level: args.approver_level,
    changes: args.changes,
    requested_by: args.requested_by,
    requested_by_name: args.requested_by_name,
    requested_by_role: args.requested_by_role,
    region: args.region ?? null,
    district: args.district ?? null,
    school_code: args.school_code ?? null,
    status: "pending",
  });
  return { error };
}

/** Apply an approved change request to the underlying table. */
export async function applyChangeRequest(cr: {
  id: string; entity: string; entity_ref: string; changes: ChangeSet;
}) {
  const updates: Record<string, unknown> = {};
  for (const [field, val] of Object.entries(cr.changes)) {
    updates[field] = (val as FieldChange).new;
  }
  if (cr.entity === "student") {
    return supabase.from("students").update(updates).eq("tsid", cr.entity_ref);
  }
  return supabase.from("schools").update(updates).eq("school_code", cr.entity_ref);
}

const FIELD_LABELS: Record<string, string> = {
  fullname: "Full Name", dob: "Date of Birth", tsid: "TSID",
  school_code: "School (transfer)", photo: "Photo", parent_phone: "Parent Phone",
  address: "Address", parent_name: "Parent Name", parent_nida: "Parent NIDA",
  relationship: "Relationship", blood_group: "Blood Group",
  school_name: "School Name", phone: "Phone", email: "Email",
};
export function fieldLabel(f: string): string {
  return FIELD_LABELS[f] ?? f.replace(/_/g, " ");
}
