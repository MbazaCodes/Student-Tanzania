import { useRef } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ASSETS } from "@/lib/tsid";
import { distributeFee } from "@/lib/letter-requests";

export type ReceiptData = {
  receipt_no: string;
  service_number: string;
  payment_ref?: string | null;
  payment_method?: string | null;
  date: string;
  student_name: string;
  tsid: string;
  school_name: string;
  purpose: string;
  amount: number;
};

/**
 * Official payment receipt for a letter request, with fee distribution.
 * Renders to a downloadable A4 PDF.
 */
export function ReceiptDocument({ data }: { data: ReceiptData }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const dist = distributeFee(data.amount);

  async function download() {
    if (!ref.current) return;
    const png = await toPng(ref.current, { pixelRatio: 3, cacheBust: true, backgroundColor: "#ffffff" });
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const w = 210, h = (ref.current.offsetHeight / ref.current.offsetWidth) * 210;
    pdf.addImage(png, "PNG", 0, 0, w, Math.min(h, 297));
    pdf.save(`TSID-Receipt-${data.tsid}.pdf`);
  }

  return (
    <div className="space-y-3">
      <div style={{ overflowX: "auto" }}>
        <div ref={ref} style={{
          width: 760, background: "#fff", color: "#1a1a1a",
          padding: "48px 56px", fontFamily: "Georgia, 'Times New Roman', serif",
          boxShadow: "0 2px 12px rgba(0,0,0,.12)", margin: "0 auto", boxSizing: "border-box",
        }}>
          {/* Header */}
          <div style={{ textAlign: "center", borderBottom: "3px double #1EB53A", paddingBottom: 16, marginBottom: 18 }}>
            <img src={ASSETS.coat} alt="" style={{ width: 60, height: 60, objectFit: "contain", margin: "0 auto 6px" }} />
            <div style={{ fontSize: 14, fontWeight: 800, color: "#002855" }}>JAMHURI YA MUUNGANO WA TANZANIA</div>
            <div style={{ fontSize: 11, color: "#1EB53A", fontWeight: 700 }}>WIZARA YA ELIMU, SAYANSI NA TEKNOLOJIA</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#002855", marginTop: 10, letterSpacing: 1 }}>
              RISITI YA MALIPO / PAYMENT RECEIPT
            </div>
          </div>

          {/* Meta */}
          <table style={{ width: "100%", fontSize: 12.5, marginBottom: 16, borderCollapse: "collapse" }}>
            <tbody>
              {[
                ["Risiti Na. / Receipt No.", data.receipt_no],
                ["Namba ya Huduma / Service No.", data.service_number],
                ...(data.payment_ref ? [["Kumb. ya Malipo / Payment Ref", data.payment_ref]] : []),
                ["Njia / Method", (data.payment_method ?? "mobile") === "online" ? "Online" : "Simu (Mobile)"],
                ["Tarehe / Date", data.date],
              ].map(([k, v]) => (
                <tr key={k as string}>
                  <td style={{ padding: "4px 0", fontWeight: 700, width: 230 }}>{k}</td>
                  <td style={{ padding: "4px 0" }}>: {v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Payer */}
          <div style={{ background: "#f6f8fa", borderRadius: 8, padding: "12px 16px", fontSize: 12.5, marginBottom: 16 }}>
            <div><strong>Mlipaji / Payer:</strong> {data.student_name} ({data.tsid})</div>
            <div><strong>Shule / School:</strong> {data.school_name}</div>
            <div><strong>Huduma / Service:</strong> Barua ya Uthibitisho — {data.purpose}</div>
          </div>

          {/* Amount */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
            border: "2px solid #002855", borderRadius: 8, padding: "12px 16px", marginBottom: 18 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Jumla Iliyolipwa / Total Paid</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#1EB53A" }}>TZS {data.amount.toLocaleString()}</span>
          </div>

          {/* Fee distribution */}
          <div style={{ fontSize: 12.5 }}>
            <div style={{ fontWeight: 800, marginBottom: 6, color: "#002855" }}>MGAWANYO WA ADA / FEE DISTRIBUTION</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#002855", color: "#fff" }}>
                  <th style={{ textAlign: "left", padding: "7px 10px" }}>Mpokeaji / Beneficiary</th>
                  <th style={{ textAlign: "right", padding: "7px 10px", width: 90 }}>%</th>
                  <th style={{ textAlign: "right", padding: "7px 10px", width: 130 }}>TZS</th>
                </tr>
              </thead>
              <tbody>
                {dist.map((d, i) => (
                  <tr key={d.key} style={{ background: i % 2 ? "#f6f8fa" : "#fff" }}>
                    <td style={{ padding: "7px 10px" }}>{d.label}</td>
                    <td style={{ padding: "7px 10px", textAlign: "right" }}>{d.pct}%</td>
                    <td style={{ padding: "7px 10px", textAlign: "right" }}>{d.value.toLocaleString()}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 800, borderTop: "2px solid #002855" }}>
                  <td style={{ padding: "7px 10px" }}>Jumla / Total</td>
                  <td style={{ padding: "7px 10px", textAlign: "right" }}>100%</td>
                  <td style={{ padding: "7px 10px", textAlign: "right" }}>{data.amount.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 28, paddingTop: 12, borderTop: "1px solid #ddd", fontSize: 9.5, color: "#888", textAlign: "center" }}>
            Risiti hii imetolewa kielektroniki na TSID · {data.receipt_no} · Electronically generated — no signature required
          </div>
        </div>
      </div>

      <Button onClick={download} className="bg-primary w-full">
        <Download className="h-4 w-4 mr-2" /> Download Receipt (PDF)
      </Button>
    </div>
  );
}
