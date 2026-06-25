import { useRef } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ASSETS } from "@/lib/tsid";

export type LetterData = {
  ref_no: string;
  date: string;
  student_name: string;
  tsid: string;
  school_name: string;
  level?: string;
  sector: string;
  purpose: string;
  reason?: string;
  recipient_name?: string;
  recipient_address?: string;
  region?: string;
  district?: string;
};

/**
 * Official TSID confirmation letter with TZ coat of arms letterhead.
 * Renders to a downloadable A4 PDF.
 */
export function LetterDocument({ data }: { data: LetterData }) {
  const ref = useRef<HTMLDivElement | null>(null);

  async function download() {
    if (!ref.current) return;
    const png = await toPng(ref.current, { pixelRatio: 3, cacheBust: true, backgroundColor: "#ffffff" });
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const w = 210, h = (ref.current.offsetHeight / ref.current.offsetWidth) * 210;
    pdf.addImage(png, "PNG", 0, 0, w, Math.min(h, 297));
    pdf.save(`TSID-Letter-${data.tsid}.pdf`);
  }

  return (
    <div className="space-y-3">
      <div style={{ overflowX: "auto" }}>
        <div ref={ref} style={{
          width: 760, minHeight: 1000, background: "#fff", color: "#1a1a1a",
          padding: "56px 64px", fontFamily: "Georgia, 'Times New Roman', serif",
          boxShadow: "0 2px 12px rgba(0,0,0,.12)", margin: "0 auto", boxSizing: "border-box",
        }}>
          {/* Letterhead */}
          <div style={{ textAlign: "center", borderBottom: "3px double #002855", paddingBottom: 18, marginBottom: 8 }}>
            <img src={ASSETS.coat} alt="" style={{ width: 70, height: 70, objectFit: "contain", margin: "0 auto 8px" }} />
            <div style={{ fontSize: 15, fontWeight: 800, color: "#002855", letterSpacing: 0.5 }}>
              JAMHURI YA MUUNGANO WA TANZANIA
            </div>
            <div style={{ fontSize: 12, color: "#1EB53A", fontWeight: 700, marginTop: 2 }}>
              WIZARA YA ELIMU, SAYANSI NA TEKNOLOJIA
            </div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>
              Tanzania Student Identification System (TSID)
            </div>
          </div>

          {/* Ref + date */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, margin: "18px 0 24px" }}>
            <div><strong>Kumb. Na / Ref:</strong> {data.ref_no}</div>
            <div><strong>Tarehe / Date:</strong> {data.date}</div>
          </div>

          {/* Recipient */}
          {(data.recipient_name || data.recipient_address) && (
            <div style={{ fontSize: 12.5, marginBottom: 20, lineHeight: 1.6 }}>
              {data.recipient_name && <div><strong>{data.recipient_name}</strong></div>}
              {data.recipient_address && <div style={{ whiteSpace: "pre-line" }}>{data.recipient_address}</div>}
              {(data.district || data.region) && <div>{[data.district, data.region].filter(Boolean).join(", ")}</div>}
            </div>
          )}

          {/* Subject */}
          <div style={{ fontSize: 13, fontWeight: 800, textDecoration: "underline", margin: "8px 0 18px", textTransform: "uppercase" }}>
            YAH: UTHIBITISHO WA MWANAFUNZI — {data.purpose}
          </div>

          {/* Body */}
          <div style={{ fontSize: 12.5, lineHeight: 1.9, textAlign: "justify" }}>
            <p>Kwa heshima na taadhima, ninathibitisha kwamba mtajwa hapo chini ni mwanafunzi
            aliyesajiliwa rasmi katika Mfumo wa Utambuzi wa Wanafunzi Tanzania (TSID).</p>

            <table style={{ width: "100%", fontSize: 12.5, margin: "16px 0", borderCollapse: "collapse" }}>
              <tbody>
                {[
                  ["Jina / Name", data.student_name],
                  ["Namba ya TSID", data.tsid],
                  ["Shule / School", data.school_name],
                  ...(data.level ? [["Ngazi / Level", data.level]] : []),
                  ["Sekta / Sector", data.sector === "government" ? "Serikali (Government)" : "Binafsi (Private)"],
                  ["Madhumuni / Purpose", data.purpose],
                ].map(([k, v]) => (
                  <tr key={k as string}>
                    <td style={{ padding: "5px 0", width: 180, fontWeight: 700, verticalAlign: "top" }}>{k}</td>
                    <td style={{ padding: "5px 0" }}>: {v}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {data.reason && (
              <p><strong>Maelezo / Details:</strong> {data.reason}</p>
            )}

            <p>Barua hii imetolewa kwa ajili ya {data.purpose.toLowerCase()} na inathibitisha
            uhalali wa mwanafunzi huyu. Tafadhali toa ushirikiano unaostahili.</p>

            <p>Kwa uthibitisho zaidi, tembelea: <strong>tsid.go.tz/verify</strong> ukitumia namba ya TSID.</p>
          </div>

          {/* Signature */}
          <div style={{ marginTop: 48, fontSize: 12.5 }}>
            <div style={{ borderTop: "1px solid #002855", width: 220, paddingTop: 6 }}>
              <strong>Mkuu wa Shule / Head of School</strong><br />
              {data.school_name}
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 40, paddingTop: 12, borderTop: "1px solid #ddd", fontSize: 9.5, color: "#888", textAlign: "center" }}>
            Hati hii imetolewa kielektroniki na TSID · Ref: {data.ref_no} · This document was issued electronically by TSID
          </div>
        </div>
      </div>

      <Button onClick={download} className="bg-primary w-full">
        <Download className="h-4 w-4 mr-2" /> Download Letter (PDF)
      </Button>
    </div>
  );
}
