import { useRef } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ASSETS } from "@/lib/tsid";
import {
  DEV_CATEGORIES, EXAM_INDEX_FIELDS, type DevRecord, type CategoryDetail,
  recordScore, scoreForRating, developmentProgress, requiredYears,
} from "@/lib/development";

export function DevelopmentReport({ student, records, fieldwork = [] }: { student: any; records: DevRecord[]; fieldwork?: any[] }) {
  const ref = useRef<HTMLDivElement | null>(null);

  const years = requiredYears({
    startYear: student.start_year, startLevel: student.start_level,
    currentLevel: student.level, schoolType: student.school_type, enrollmentDate: student.enrollment_date,
  });
  const progress = developmentProgress(records, years);
  const sorted = [...records].sort((a, b) => a.year - b.year || String(a.term).localeCompare(String(b.term)));

  async function download() {
    if (!ref.current) return;
    const png = await toPng(ref.current, { pixelRatio: 2.5, cacheBust: true, backgroundColor: "#ffffff" });
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pw = 210;
    const ph = (ref.current.offsetHeight / ref.current.offsetWidth) * pw;
    let remaining = ph, pos = 0;
    // paginate tall content across A4 pages
    while (remaining > 0) {
      pdf.addImage(png, "PNG", 0, pos ? -(pos) : 0, pw, ph);
      remaining -= 297;
      if (remaining > 0) { pdf.addPage(); pos += 297; }
    }
    pdf.save(`TSID-Development-${student.tsid}.pdf`);
  }

  return (
    <div className="space-y-3">
      <div style={{ overflowX: "auto" }}>
        <div ref={ref} style={{
          width: 800, background: "#fff", color: "#1a1a1a",
          padding: "44px 52px", fontFamily: "Georgia, 'Times New Roman', serif",
          boxShadow: "0 2px 12px rgba(0,0,0,.12)", margin: "0 auto", boxSizing: "border-box",
        }}>
          {/* Header / letterhead */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, borderBottom: "3px double #002855", paddingBottom: 16 }}>
            <img src={ASSETS.coat} alt="" style={{ width: 54, height: 54, objectFit: "contain" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#002855" }}>JAMHURI YA MUUNGANO WA TANZANIA</div>
              <div style={{ fontSize: 10.5, color: "#1EB53A", fontWeight: 700 }}>WIZARA YA ELIMU, SAYANSI NA TEKNOLOJIA · TSID</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#002855", marginTop: 4 }}>STUDENT DEVELOPMENT REPORT</div>
            </div>
            {student.photo && (
              <img src={student.photo} alt="" crossOrigin="anonymous"
                style={{ width: 78, height: 96, objectFit: "cover", border: "2px solid #002855", borderRadius: 4 }} />
            )}
          </div>

          {/* Identity */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontSize: 12.5 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{student.fullname}</div>
              <div style={{ color: "#555", fontFamily: "monospace" }}>{student.tsid}</div>
              <div style={{ marginTop: 4 }}>{student.school_name}{student.level ? ` · ${student.level}` : ""}</div>
              <div style={{ color: "#555" }}>{[student.district, student.region].filter(Boolean).join(", ")}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: progress.complete ? "#16a34a" : "#d97706" }}>{progress.avgScore}%</div>
              <div style={{ fontSize: 10, color: "#555" }}>Avg Development Score</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>{progress.doneYears.length}/{years.length} years recorded</div>
            </div>
          </div>

          {/* Talent */}
          {(student.talent_primary || student.talent_secondary) && (
            <div style={{ marginTop: 14, background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
              <div style={{ fontWeight: 800, color: "#92400e" }}>★ TALENT</div>
              <div style={{ marginTop: 2 }}>{[student.talent_primary, student.talent_secondary].filter(Boolean).join(" · ")}</div>
              {student.talent_notes && <div style={{ color: "#555", marginTop: 2 }}>{student.talent_notes}</div>}
            </div>
          )}

          {/* Exam / registration index numbers */}
          {EXAM_INDEX_FIELDS.some((f) => student[f.key]) && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#002855", borderBottom: "1px solid #ccc", paddingBottom: 4, marginBottom: 8 }}>
                EXAMINATION / REGISTRATION INDEX NUMBERS
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 24px", fontSize: 11.5 }}>
                {EXAM_INDEX_FIELDS.filter((f) => student[f.key]).map((f) => (
                  <div key={f.key} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#555" }}>{f.label}</span>
                    <span style={{ fontWeight: 700, fontFamily: "monospace" }}>{student[f.key]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Year-by-year (CV style) */}
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#002855", borderBottom: "1px solid #ccc", paddingBottom: 4, marginBottom: 10 }}>
              DEVELOPMENT HISTORY
            </div>
            {sorted.length === 0 && <div style={{ fontSize: 12, color: "#777" }}>No development records yet.</div>}
            {sorted.map((r: any, i) => {
              const sc = recordScore(r);
              return (
                <div key={i} style={{ marginBottom: 16, paddingLeft: 14, borderLeft: "3px solid #1EB53A" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>{r.year} · {r.term}{r.level ? ` — ${r.level}` : ""}</div>
                    {sc > 0 && <div style={{ fontSize: 13, fontWeight: 800, color: sc >= 75 ? "#16a34a" : sc >= 50 ? "#d97706" : "#dc2626" }}>{sc}%</div>}
                  </div>
                  {DEV_CATEGORIES.map((c) => {
                    const d: CategoryDetail = r[c.detail] ?? {};
                    if (!d.rating && !d.comment) return null;
                    return (
                      <div key={c.key} style={{ marginTop: 5, fontSize: 11.5 }}>
                        <span style={{ fontWeight: 700 }}>{c.label.replace(" Remarks", "")}: </span>
                        {d.rating && <span style={{ color: "#3730a3", fontWeight: 600 }}>{d.rating} ({d.score ?? scoreForRating(d.rating)}%) — </span>}
                        <span>{d.comment ?? ""}</span>
                      </div>
                    );
                  })}
                  {r.talent_area && (
                    <div style={{ marginTop: 5, fontSize: 11.5, color: "#92400e" }}>
                      <span style={{ fontWeight: 700 }}>★ Talent: </span>{r.talent_area}{r.talent_remark ? ` — ${r.talent_remark}` : ""}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Work experience / field attachments (CV style) */}
          {fieldwork.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#002855", borderBottom: "1px solid #ccc", paddingBottom: 4, marginBottom: 10 }}>
                WORK EXPERIENCE / FIELD ATTACHMENTS
              </div>
              {fieldwork.map((w: any, i) => (
                <div key={i} style={{ marginBottom: 14, paddingLeft: 14, borderLeft: "3px solid #002855" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>{w.job_title || w.attachment_type} — {w.institution}</div>
                    {typeof w.score === "number" && w.score > 0 && <div style={{ fontSize: 12.5, fontWeight: 800, color: w.score >= 75 ? "#16a34a" : "#d97706" }}>{w.score}%</div>}
                  </div>
                  <div style={{ fontSize: 11, color: "#555" }}>
                    {w.sector === "government" ? "Government" : "Private"}{w.industry ? ` · ${w.industry}` : ""}
                    {w.year ? ` · ${w.year}` : ""}{(w.region || w.district) ? ` · ${[w.district, w.region].filter(Boolean).join(", ")}` : ""}
                  </div>
                  {w.designation && <div style={{ fontSize: 11.5, marginTop: 2 }}><strong>Designation:</strong> {w.designation}</div>}
                  {w.duties && <div style={{ fontSize: 11.5, marginTop: 2 }}><strong>Duties:</strong> {w.duties}</div>}
                  {Array.isArray(w.kpis) && w.kpis.length > 0 && (
                    <div style={{ fontSize: 11.5, marginTop: 2 }}>
                      <strong>KPIs:</strong> {w.kpis.map((k: any) => `${k.name}${k.score != null ? ` (${k.score}%)` : ""}`).join("; ")}
                    </div>
                  )}
                  {w.report_to_name && <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>Supervisor: {w.report_to_name}{w.report_to_email ? ` · ${w.report_to_email}` : ""}</div>}
                  {w.remark && <div style={{ fontSize: 11.5, marginTop: 2, fontStyle: "italic" }}>{w.rating ? `${w.rating} — ` : ""}{w.remark}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: 24, paddingTop: 12, borderTop: "1px solid #ddd", fontSize: 9, color: "#888", textAlign: "center" }}>
            TSID Lifetime Development Record · Generated {new Date().toLocaleDateString("en-GB")} · This is an official educational development summary.
          </div>
        </div>
      </div>

      <Button onClick={download} className="bg-primary w-full">
        <Download className="h-4 w-4 mr-2" /> Download Development Report (PDF)
      </Button>
    </div>
  );
}
