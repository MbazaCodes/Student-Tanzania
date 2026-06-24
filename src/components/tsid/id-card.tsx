import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ASSETS } from "@/lib/tsid";

export type IdCardData = {
  tsid: string;
  fullname: string;
  school_name?: string | null;
  school_code?: string | null;
  region?: string | null;
  district?: string | null;
  dob?: string | null;
  gender?: string | null;
  nationality?: string | null;
  photo_url?: string | null;
  status?: string | null;
  level?: string | null;
  blood_group?: string | null;
  enrollment_date?: string | null;
  issue_date?: string | null;
  parent_name?: string | null;
  parent_nida?: string | null;
  relationship?: string | null;
  parent_phone?: string | null;
};

// ── CR80 card dimensions: 53.98mm × 85.60mm @ 96dpi ──────────────────────────
// 1mm = 3.7795px  →  53.98mm = ~204px, 85.60mm = ~324px
const W = 204;
const H = 324;

const C = {
  navy:   "#003366",
  green:  "#1B8F3A",
  yellow: "#F5C400",
  blue:   "#007AFF",
  dark:   "#111111",
  muted:  "#555555",
  bg:     "#F4F7F9",
  white:  "#FFFFFF",
};

const F = { family: "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif" };

function fmtDate(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    }).toUpperCase();
  } catch { return d; }
}

// ── Tanzania Flag (inline SVG, exact proportions) ─────────────────────────────
function TzFlagSVG({ w = 40, h = 27 }: { w?: number; h?: number }) {
  return (
    <svg viewBox="0 0 60 40" width={w} height={h}
      style={{ display: "block", borderRadius: 1, boxShadow: "0 0.4px 1.5px rgba(0,0,0,.18)", flexShrink: 0 }}>
      <rect width="60" height="40" fill="#1EB53A" />
      {/* diagonal black band */}
      <polygon points="0,40 60,0 60,12 0,30" fill="#000" />
      {/* yellow borders on black band */}
      <polygon points="0,40 60,0 60,5  0,23" fill="#FCD116" />
      <polygon points="0,33 53,0 60,0 0,40" fill="#FCD116" />
      {/* blue triangles */}
      <polygon points="0,23 53,0 60,0 60,5 0,17" fill="#00A3DD" />
      <polygon points="0,33 60,5 60,12 0,40" fill="#00A3DD" />
    </svg>
  );
}

// ── Official TSID Stamp ───────────────────────────────────────────────────────
function TsidStamp({ size = 40 }: { size?: number }) {
  const r = size / 2 - 1;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.navy} strokeWidth={0.9} />
      <circle cx={size/2} cy={size/2} r={r - 2.5} fill="none" stroke={C.navy} strokeWidth={0.4} />
      {/* arc text top */}
      <defs>
        <path id="arcTop"  d={`M ${size/2 - r + 3},${size/2} a ${r-3},${r-3} 0 0,1 ${(r-3)*2},0`} />
        <path id="arcBot"  d={`M ${size/2 - r + 3},${size/2} a ${r-3},${r-3} 0 0,0 ${(r-3)*2},0`} />
      </defs>
      <text fontSize={3.8} fontWeight="800" fill={C.navy} fontFamily={F.family} letterSpacing={0.4}>
        <textPath href="#arcTop" startOffset="10%">TANZANIA STUDENT</textPath>
      </text>
      <text fontSize={3.8} fontWeight="800" fill={C.navy} fontFamily={F.family} letterSpacing={0.2}>
        <textPath href="#arcBot" startOffset="18%">IDENTIFICATION SYSTEM</textPath>
      </text>
      <text x={size/2} y={size/2 + 2} textAnchor="middle" fontSize={7} fontWeight="900"
        fill={C.navy} fontFamily={F.family}>TSID</text>
    </svg>
  );
}

// ── School crest badge ────────────────────────────────────────────────────────
function SchoolBadge({ size = 12 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, background: C.navy, borderRadius: 2,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <svg viewBox="0 0 24 24" width={size * 0.65} height={size * 0.65}
        fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 20h20M4 20V10l8-7 8 7v10M9 20v-5h6v5" />
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CARD FRONT
// ═══════════════════════════════════════════════════════════════════════════════
export function IdCardFrontOnly({ data, qr }: { data: IdCardData; qr: string }) {
  return <CardFront data={data} qr={qr} />;
}
export function IdCardBackOnly({ data }: { data: IdCardData }) {
  return <CardBack data={data} />;
}

function CardFront({ data, qr }: { data: IdCardData; qr: string }) {
  return (
    <div style={{
      width: W, height: H,
      background: C.white,
      borderRadius: 12,
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 8px 28px rgba(0,0,0,.13)",
      border: `0.75px solid #C4CBD3`,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      fontFamily: F.family,
    }}>
      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <header style={{
        padding: "10px 13px 7px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <img src={ASSETS.coat} alt="" style={{ width: 38, height: 38, objectFit: "contain", flexShrink: 0 }} />
        <div style={{ flexGrow: 1, paddingLeft: 8 }}>
          <div style={{ color: C.navy, fontSize: 22, fontWeight: 900, lineHeight: 0.9, letterSpacing: -0.5 }}>TSID</div>
          <div style={{ color: C.navy, fontSize: 5.8, fontWeight: 800, letterSpacing: 0.18, lineHeight: 1.15, marginTop: 2 }}>
            TANZANIA STUDENT<br />IDENTIFICATION SYSTEM
          </div>
        </div>
        <TzFlagSVG w={40} h={27} />
      </header>

      {/* ── PROFILE SECTION ───────────────────────────────────────────── */}
      <div style={{
        padding: "0 13px",
        display: "flex",
        gap: 11,
        alignItems: "stretch",
        flexGrow: 1.5,
        marginBottom: 2,
      }}>
        {/* Photo */}
        <div style={{
          width: 72, height: 96, borderRadius: 4,
          overflow: "hidden", border: `0.75px solid #D1D5DB`,
          flexShrink: 0, background: "#e8edf3",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {data.photo_url
            ? <img src={data.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: 30, opacity: 0.35 }}>👤</span>}
        </div>

        {/* Identity fields */}
        <div style={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          paddingTop: 2,
          paddingBottom: 2,
        }}>
          {/* TSID number */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 5.8, fontWeight: 700, color: C.navy, letterSpacing: 0.1 }}>TSID NUMBER</span>
            <span style={{
              fontSize: 9.5, fontWeight: 900, color: C.navy,
              borderBottom: `1.5px solid ${C.green}`,
              paddingBottom: 1, display: "block", lineHeight: 1.15,
              fontFamily: "ui-monospace, monospace",
              letterSpacing: 0.2,
            }}>{data.tsid}</span>
          </div>

          {/* Standard fields */}
          {[
            ["FULL NAME",    (data.fullname || "—").toUpperCase()],
            ["DATE OF BIRTH", fmtDate(data.dob)],
            ["GENDER",       (data.gender || "—").toUpperCase()],
            ["NATIONALITY",  (data.nationality || "TANZANIAN").toUpperCase()],
          ].map(([lbl, val]) => (
            <div key={lbl} style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 5.2, fontWeight: 700, color: C.muted, letterSpacing: 0.1 }}>{lbl}</span>
              <span style={{ fontSize: 7.5, fontWeight: 700, color: C.dark, lineHeight: 1.1 }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── LOWER: SCHOOL + QR ────────────────────────────────────────── */}
      <div style={{
        padding: "7px 13px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexGrow: 1,
        background: "#f8fafc",
        borderTop: `0.5px solid #e2e8f0`,
        borderBottom: `0.5px solid #e2e8f0`,
      }}>
        {/* School info */}
        <div style={{ maxWidth: 110 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
            <SchoolBadge size={14} />
            <span style={{ fontSize: 6.5, fontWeight: 800, color: C.navy, lineHeight: 1.15 }}>
              {(data.school_name || "—").toUpperCase()}
            </span>
          </div>
          <div style={{ fontSize: 6, color: C.dark, lineHeight: 1.55, fontWeight: 500 }}>
            {data.school_code && <><span style={{ fontWeight: 400, color: C.muted }}>SCHOOL ID: </span><span style={{ fontWeight: 700 }}>{data.school_code}</span><br /></>}
            {data.region    && <><span style={{ fontWeight: 400, color: C.muted }}>REGION: </span><span style={{ fontWeight: 700 }}>{data.region.toUpperCase()}</span><br /></>}
            {data.district  && <><span style={{ fontWeight: 400, color: C.muted }}>DISTRICT: </span><span style={{ fontWeight: 700 }}>{data.district.toUpperCase()}</span></>}
          </div>
        </div>

        {/* QR Code */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          border: `0.6px solid #CCC`,
          padding: 2, borderRadius: 3,
          background: C.white, width: 54, flexShrink: 0,
        }}>
          {qr
            ? <img src={qr} alt="QR" style={{ width: 46, height: 46 }} />
            : <div style={{ width: 46, height: 46, background: "#eee" }} />}
          <div style={{ fontSize: 4, fontWeight: 900, color: C.dark, marginTop: 1.5, textAlign: "center", letterSpacing: 0.3 }}>
            SCAN TO VERIFY
          </div>
        </div>
      </div>

      {/* ── FOOTER: status bar ────────────────────────────────────────── */}
      <div style={{ marginTop: "auto", width: "100%", flexShrink: 0 }}>
        <div style={{
          width: "100%", height: 28,
          background: C.navy,
          display: "flex", justifyContent: "space-around", alignItems: "center",
          padding: "0 4px",
        }}>
          {[
            ["🛡", "LIFELONG", "STUDENT ID"],
            ["✦", "NATIONALLY", "RECOGNIZED"],
            ["✔", "SECURE", "& VERIFIED"],
          ].map(([icon, l1, l2]) => (
            <div key={l1} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#fff", lineHeight: 1 }}>{icon}</div>
              <div style={{ fontSize: 4, fontWeight: 700, color: "#a3c4dd", lineHeight: 1.3, marginTop: 1 }}>
                {l1}<br />{l2}
              </div>
            </div>
          ))}
        </div>
        {/* Flag stripe */}
        <div style={{ width: "100%", height: 4, display: "flex" }}>
          <div style={{ flex: 4.5, background: C.green }} />
          <div style={{ flex: 1,   background: C.yellow }} />
          <div style={{ flex: 1,   background: "#000" }} />
          <div style={{ flex: 3.5, background: C.blue }} />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CARD BACK
// ═══════════════════════════════════════════════════════════════════════════════
function CardBack({ data }: { data: IdCardData }) {
  return (
    <div style={{
      width: W, height: H,
      background: C.bg,
      borderRadius: 12,
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 8px 28px rgba(0,0,0,.13)",
      border: `0.75px solid #C4CBD3`,
      display: "flex",
      flexDirection: "column",
      fontFamily: F.family,
    }}>
      {/* ── HEADER STRIP ──────────────────────────────────────────────── */}
      <div style={{
        background: C.navy, color: C.white,
        height: 26, lineHeight: "26px",
        textAlign: "center",
        fontSize: 11, fontWeight: 700,
        letterSpacing: 0.5,
        flexShrink: 0,
        fontFamily: "ui-monospace, monospace",
      }}>
        {data.tsid}
      </div>

      {/* ── BODY ──────────────────────────────────────────────────────── */}
      <div style={{
        padding: "9px 13px",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        justifyContent: "space-between",
        gap: 6,
      }}>
        {/* Watermark coat of arms */}
        <img src={ASSETS.coat} alt="" style={{
          position: "absolute", right: 10, top: 8,
          width: 72, height: "auto", opacity: 0.045,
          pointerEvents: "none", userSelect: "none",
        }} />

        {/* ── Student Information ─────────────────────────────────────── */}
        <div>
          <div style={{
            fontSize: 6, fontWeight: 900, color: C.navy,
            textTransform: "uppercase",
            borderBottom: `1px solid ${C.green}`,
            paddingBottom: 1.5, marginBottom: 4,
            letterSpacing: 0.2,
          }}>Student Information</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {[
                ["Date of Enrollment", fmtDate(data.enrollment_date)],
                ["Current Level",      (data.level || "—").toUpperCase()],
                ["Blood Group",        data.blood_group || "—"],
                ["Phone (Guardian)",   data.parent_phone || "—"],
              ].map(([lbl, val]) => (
                <tr key={lbl}>
                  <td style={{ fontSize: 5.5, fontWeight: 700, color: C.muted, textTransform: "uppercase", paddingBottom: 3, width: 80, verticalAlign: "middle" }}>{lbl}</td>
                  <td style={{ fontSize: 6.2, fontWeight: 700, color: C.dark, paddingBottom: 3, verticalAlign: "middle" }}>{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Parent / Guardian ───────────────────────────────────────── */}
        <div>
          <div style={{
            fontSize: 6, fontWeight: 900, color: C.navy,
            textTransform: "uppercase",
            borderBottom: `1px solid ${C.green}`,
            paddingBottom: 1.5, marginBottom: 4,
            letterSpacing: 0.2,
          }}>Parent / Guardian</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", flexGrow: 1 }}>
              <tbody>
                {[
                  ["Name",         (data.parent_name || "—").toUpperCase()],
                  ["NIDA Number",  data.parent_nida || "—"],
                  ["Relationship", (data.relationship || "—").toUpperCase()],
                  ["Phone",        data.parent_phone || "—"],
                ].map(([lbl, val]) => (
                  <tr key={lbl}>
                    <td style={{ fontSize: 5.5, fontWeight: 700, color: C.muted, textTransform: "uppercase", paddingBottom: 3, width: 80, verticalAlign: "middle" }}>{lbl}</td>
                    <td style={{ fontSize: 6.2, fontWeight: 700, color: C.dark, paddingBottom: 3, verticalAlign: "middle" }}>{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Official stamp */}
            <div style={{ flexShrink: 0 }}>
              <TsidStamp size={44} />
            </div>
          </div>
        </div>

        {/* ── Important notice ────────────────────────────────────────── */}
        <div style={{
          border: `0.6px solid #C6E2D0`,
          background: "#EBF7EE",
          borderRadius: 2.5,
          padding: "4px 6px",
        }}>
          <div style={{ fontSize: 6, fontWeight: 900, color: C.green, textTransform: "uppercase", marginBottom: 2 }}>
            Important
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {[
              "This card is the property of the Government of Tanzania.",
              "It is valid for educational identification nationwide.",
              "Report loss of this card to your school immediately.",
              "This card is not transferable.",
            ].map((t) => (
              <li key={t} style={{ fontSize: 5, color: "#222", fontWeight: 500, lineHeight: 1.4, paddingLeft: 5, position: "relative", marginBottom: 1 }}>
                <span style={{ position: "absolute", left: 0 }}>•</span>{t}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Verification footer row ──────────────────────────────────── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          paddingTop: 2,
        }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 5, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>Verification Portal</span>
            <span style={{ fontSize: 6.5, fontWeight: 700, color: C.blue }}>verify.tsid.go.tz</span>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 5, fontWeight: 700, color: C.muted, textTransform: "uppercase", display: "block" }}>Issued On</span>
            <span style={{ fontSize: 6.5, fontWeight: 700, color: C.navy }}>{fmtDate(data.issue_date)}</span>
          </div>
        </div>
      </div>

      {/* ── BASE SECURITY STRIP ───────────────────────────────────────── */}
      <div style={{
        marginTop: "auto",
        width: "100%", height: 22,
        background: C.navy,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 10px",
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 5, lineHeight: 1.25, fontWeight: 500, color: C.white, maxWidth: "62%" }}>
          <strong style={{ fontWeight: 700 }}>This card contains secure data.</strong><br />
          Unauthorized use is prohibited by law.
        </div>
        <div style={{ fontSize: 5.2, fontWeight: 700, color: C.white, textAlign: "right", lineHeight: 1.25 }}>
          JAMHURI YA MUUNGANO<br />WA TANZANIA
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PUBLIC EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export function IdCard({ data, showBack = true, downloadable = true }: {
  data: IdCardData;
  showBack?: boolean;
  downloadable?: boolean;
}) {
  const [qr, setQr] = useState("");
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef  = useRef<HTMLDivElement>(null);

  const verifyUrl = typeof window !== "undefined"
    ? `${window.location.origin}/search?id=${encodeURIComponent(data.tsid)}`
    : `https://verify.tsid.go.tz/id/${data.tsid}`;

  useEffect(() => {
    QRCode.toDataURL(verifyUrl, {
      margin: 1, width: 200,
      color: { dark: "#000000", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }).then(setQr).catch(() => setQr(""));
  }, [verifyUrl]);

  async function downloadSide(ref: React.RefObject<HTMLDivElement | null>, side: string) {
    if (!ref.current) return;
    const png = await toPng(ref.current, { pixelRatio: 3, cacheBust: true });
    const a = document.createElement("a");
    a.href = png; a.download = `TSID-${data.tsid}-${side}.png`; a.click();
  }

  return (
    <div style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "flex-start" }}>
      {/* FRONT */}
      <div>
        <div style={{ fontSize: 9, fontWeight: 800, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, textAlign: "center" }}>FRONT</div>
        <div ref={frontRef}><CardFront data={data} qr={qr} /></div>
        {downloadable && (
          <Button onClick={() => downloadSide(frontRef, "FRONT")} variant="secondary" size="sm" className="mt-2 w-full">
            <Download className="h-3.5 w-3.5 mr-2" /> Download Front
          </Button>
        )}
      </div>

      {/* BACK */}
      {showBack && (
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, textAlign: "center" }}>BACK</div>
          <div ref={backRef}><CardBack data={data} /></div>
          {downloadable && (
            <Button onClick={() => downloadSide(backRef, "BACK")} variant="secondary" size="sm" className="mt-2 w-full">
              <Download className="h-3.5 w-3.5 mr-2" /> Download Back
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
