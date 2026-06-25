// Letter request purpose options by sector.

export type Sector = "government" | "private";

export const GOVERNMENT_PURPOSES = [
  "NHIF (Health Insurance)",
  "Wizara Services (Ministry)",
  "NECTA Services",
  "Government Grants & Loans (HESLB)",
  "Other Government Student Request",
];

export const PRIVATE_PURPOSES = [
  "Internship",
  "Grants, Funds & Loans",
  "Scholarship Application",
  "Other Private Request",
];

export function purposesForSector(sector: Sector): string[] {
  return sector === "government" ? GOVERNMENT_PURPOSES : PRIVATE_PURPOSES;
}

// Common reasons (student can also pick "Other" and type their own)
export const COMMON_REASONS = [
  "Application / Enrollment",
  "Verification of Studentship",
  "Financial Assistance",
  "Medical / Insurance",
  "Official Records Request",
  "Other (type below)",
];

// Which purposes carry a fee (everything else is free).
// Adjust as policy dictates.
const PAID_PURPOSES = new Set<string>([
  "NECTA Services",
  "Government Grants & Loans (HESLB)",
]);

export function feeForPurpose(purpose: string): { fee_type: "free" | "paid"; amount: number } {
  if (PAID_PURPOSES.has(purpose)) return { fee_type: "paid", amount: 5000 };
  return { fee_type: "free", amount: 0 };
}

export function generateLetterRef(): string {
  const y = new Date().getFullYear();
  const n = Math.floor(100000 + Math.random() * 900000);
  return `TSID/LTR/${y}/${n}`;
}
