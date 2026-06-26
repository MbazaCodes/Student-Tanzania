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

// Flat fee: every letter request costs 2,000 TZS.
export const LETTER_FEE = 2000;

// Students with a disability are exempt (letter is free).
export function hasDisability(disability?: string | null): boolean {
  if (!disability) return false;
  const v = disability.trim().toLowerCase();
  return v !== "" && v !== "none" && v !== "hakuna";
}

// Fee for a request, considering disability exemption.
export function feeForStudent(disability?: string | null): { fee_type: "free" | "paid"; amount: number; exempt: boolean } {
  if (hasDisability(disability)) return { fee_type: "free", amount: 0, exempt: true };
  return { fee_type: "paid", amount: LETTER_FEE, exempt: false };
}

export function feeForPurpose(_purpose: string): { fee_type: "free" | "paid"; amount: number } {
  return { fee_type: "paid", amount: LETTER_FEE };
}

// Fee distribution applied on the receipt.
export const FEE_DISTRIBUTION = [
  { key: "school",  label: "School",                  pct: 50 },
  { key: "service", label: "Service Fee",             pct: 20 },
  { key: "wizara",  label: "Wizara (Ministry)",       pct: 10 },
  { key: "support", label: "Other Education Support",  pct: 20 },
] as const;

export function distributeFee(amount: number) {
  return FEE_DISTRIBUTION.map((d) => ({
    ...d,
    value: Math.round((amount * d.pct) / 100),
  }));
}

export function generateLetterRef(): string {
  const y = new Date().getFullYear();
  const n = Math.floor(100000 + Math.random() * 900000);
  return `TSID/LTR/${y}/${n}`;
}

// Payment control / service number the student uses to pay by phone.
export function generateServiceNumber(): string {
  const n = Math.floor(100000000 + Math.random() * 900000000); // 9-digit
  return `99${n}`; // 11-digit control number
}

export function generateReceiptNo(): string {
  const y = new Date().getFullYear();
  const n = Math.floor(100000 + Math.random() * 900000);
  return `TSID/RCP/${y}/${n}`;
}
