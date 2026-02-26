import PDFDocument from "pdfkit";
import path from "path";

/**
 * generateSalarySlipPDF
 * ─────────────────────
 * Drop-in replacement. Requires DejaVu Sans fonts in src/fonts/ for ₹ support.
 * Download from: https://dejavu-fonts.github.io/
 * Place DejaVuSans.ttf + DejaVuSans-Bold.ttf into src/fonts/
 */

const FONT_DIR  = path.resolve("src/fonts");
const FONT_REG  = path.join(FONT_DIR, "DejaVuSans.ttf");
const FONT_BOLD = path.join(FONT_DIR, "DejaVuSans-Bold.ttf");

const fmt = (n) =>
  "\u20B9" + Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const C = {
  navy:     "#0D1B2A", navy2:   "#162840",
  gold:     "#C9A84C", goldLt:  "#F9F0D8", goldMid: "#E8CC88",
  teal:     "#1B6CA8", tealLt:  "#EBF5FF",
  slate:    "#3A4A5C", slateL:  "#6B7A8D",
  smoke:    "#F4F7FA", white:   "#FFFFFF",
  border:   "#C8D6E8", shadow:  "#C8D4E0", muted: "#8FA8C0",
  green:    "#1A7A4A", greenLt: "#EAF6F0", greenBar: "#B2DEC8",
  red:      "#B02A2A", redLt:   "#FDF0F0", redBar:   "#E8B8B8",
  footer:   "#EEF3F8",
};

export function generateSalarySlipPDF(payroll, res) {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    info: { Title: `Salary Slip – ${payroll._id}`, Author: "Payroll System" },
  });

  doc.registerFont("DV",   FONT_REG);
  doc.registerFont("DV-B", FONT_BOLD);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="salary_slip_${payroll._id}.pdf"`);
  doc.pipe(res);

  const PW = doc.page.width;
  const PH = doc.page.height;
  const ML = 32;
  const MW = PW - 2 * ML;

  // ── Primitives ──────────────────────────────────────────────────────────────
  const box = (x, y, w, h, fill, stroke) =>
    doc.rect(x, y, w, h).fillAndStroke(fill, stroke || fill);

  const txt = (text, x, y, { size = 8, bold = false, color = C.slate, align = "left", width = null } = {}) => {
    doc.fillColor(color).font(bold ? "DV-B" : "DV").fontSize(size);
    const opts = { lineBreak: false, ...(width ? { width } : {}), ...(align !== "left" ? { align } : {}) };
    doc.text(String(text), x, y, opts);
  };

  const hline = (x1, y, x2, color, w = 0.5) =>
    doc.moveTo(x1, y).lineTo(x2, y).strokeColor(color).lineWidth(w).stroke();

  const vline = (x, y1, y2, color, w = 0.5) =>
    doc.moveTo(x, y1).lineTo(x, y2).strokeColor(color).lineWidth(w).stroke();

  let curY = 0;

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. HEADER
  // ═══════════════════════════════════════════════════════════════════════════
  const hdrH = 90;
  box(0, 0, PW, hdrH, C.navy);
  box(0, 0, PW, 3, C.gold);                        // gold top stripe
  doc.polygon([PW-180,0],[PW,0],[PW,hdrH],[PW-220,hdrH]).fill(C.navy2); // diagonal accent
  box(ML, 10, 3, hdrH - 20, C.gold);              // left accent bar

  txt(payroll.project?.projectName || "Company Name", ML+12, 22, { size:18, bold:true, color:C.white });
  txt(payroll.project?.siteName || "", ML+12, 46, { size:8.5, color:C.muted });
  txt("SALARY SLIP", ML, 24, { size:16, bold:true, color:C.gold, align:"right", width:MW });
  txt("CONFIDENTIAL  ·  FOR RECIPIENT ONLY", ML, 46, { size:7, color:C.muted, align:"right", width:MW });

  // Pay period banner
  box(0, hdrH, PW, 18, C.gold);
  txt(
    `PAY PERIOD:   ${fmtDate(payroll.periodStart)}   –   ${fmtDate(payroll.periodEnd)}`,
    ML, hdrH + 5, { size:8, bold:true, color:C.navy, align:"center", width:MW }
  );

  curY = hdrH + 30;

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. EMPLOYEE + PAYMENT CARDS
  // ═══════════════════════════════════════════════════════════════════════════
  const cardH = 118;
  const colW  = (MW - 10) / 2;
  const rightX = ML + colW + 10;

  const drawCard = (cx, cy, cw, ch, title) => {
    box(cx+2, cy+2, cw, ch, C.shadow);
    doc.rect(cx, cy, cw, ch).fillAndStroke(C.white, C.border);
    box(cx, cy, cw, 24, C.navy);
    box(cx, cy, 3, 24, C.gold);
    txt(title, cx+10, cy+8, { size:8.5, bold:true, color:C.white });
  };

  drawCard(ML, curY, colW, cardH, "EMPLOYEE DETAILS");
  drawCard(rightX, curY, colW, cardH, "PAYMENT DETAILS");

  const user = payroll.user || {};
  [
    ["Full Name", user.name || "—"],
    ["Role",      (payroll.role || "").replace(/_/g, " ").toUpperCase()],
    ["Email",     user.email || "—"],
    ["Phone",     String(user.phoneNumber || "—")],
    ["Aadhaar",   user.adharNumber || "—"],
  ].forEach(([lbl, val], i) => {
    const ry = curY + 34 + i * 17;
    txt(lbl + ":", ML+10, ry, { size:7.5, color:C.slateL });
    txt(val,       ML+72, ry, { size:7.5, bold:true, color:C.navy });
  });

  const statusColors = { paid: C.green, partially_paid: "#9A6F00", pending: C.red };
  const sc = statusColors[payroll.paymentStatus] || C.red;

  [
    ["Payroll ID", String(payroll._id).slice(-8).toUpperCase(), null],
    ["Status",     (payroll.paymentStatus || "pending").replace(/_/g, " ").toUpperCase(), sc],
    ["Pay Date",   fmtDate(payroll.paymentDate), null],
    ["Mode",       (payroll.paymentMode || "—").replace(/_/g, " ").toUpperCase(), null],
    ["Txn Ref",    payroll.transactionReference || "—", null],
  ].forEach(([lbl, val, col], i) => {
    const ry = curY + 34 + i * 17;
    txt(lbl + ":", rightX+10, ry, { size:7.5, color:C.slateL });
    txt(val,       rightX+72, ry, { size:7.5, bold:true, color: col || C.navy });
  });

  curY += cardH + 16;

  // ── Section header helper ───────────────────────────────────────────────────
  const secHdr = (title, bg) => {
    box(ML, curY, MW, 22, bg);
    box(ML, curY, 3, 22, C.gold);
    txt(title, ML+12, curY+7, { size:9, bold:true, color:C.white });
    curY += 22;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. ATTENDANCE
  // ═══════════════════════════════════════════════════════════════════════════
  secHdr("ATTENDANCE SUMMARY", C.navy);

  const attItems = [
    ["Total Working Days", payroll.totalWorkingDays || 0],
    ["Days Present",       payroll.presentDays || 0],
    ["Days Absent",        payroll.absentDays || 0],
    ["Overtime Hours",     payroll.overtimeHours || 0],
  ];
  const attH  = 54;
  const attCW = MW / attItems.length;

  doc.rect(ML, curY, MW, attH).fillAndStroke(C.smoke, C.border);
  attItems.forEach(([lbl, val], i) => {
    const ax = ML + i * attCW;
    if (i > 0) vline(ax, curY, curY + attH, C.border);
    txt(String(val), ax, curY+10, { size:22, bold:true, color:C.teal, align:"center", width:attCW });
    txt(lbl,         ax, curY+40, { size:6.5, color:C.slateL, align:"center", width:attCW });
  });
  curY += attH + 14;

  // ── Table helpers ───────────────────────────────────────────────────────────
  const tblHdr = () => {
    doc.rect(ML, curY, MW, 17).fillAndStroke(C.tealLt, C.border);
    txt("DESCRIPTION", ML+10, curY+5, { size:7.5, bold:true, color:C.teal });
    txt("AMOUNT", ML+10, curY+5, { size:7.5, bold:true, color:C.teal, align:"right", width:MW-20 });
    curY += 17;
  };

  const tblRow = (desc, amt, idx, alt) => {
    const bg = idx % 2 === 0 ? C.white : alt;
    doc.rect(ML, curY, MW, 18).fillAndStroke(bg, C.border);
    txt(desc,     ML+10, curY+5, { size:8, color:C.slate });
    txt(fmt(amt), ML+10, curY+5, { size:8, bold:true, color:C.navy, align:"right", width:MW-20 });
    curY += 18;
  };

  const tblTotal = (lbl, val, bg, fg) => {
    doc.rect(ML, curY, MW, 22).fillAndStroke(bg, C.border);
    box(ML, curY, 3, 22, C.gold);
    txt(lbl,      ML+10, curY+6, { size:9.5, bold:true, color:fg });
    txt(fmt(val), ML+10, curY+6, { size:9.5, bold:true, color:fg, align:"right", width:MW-20 });
    curY += 34;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. EARNINGS
  // ═══════════════════════════════════════════════════════════════════════════
  secHdr("EARNINGS", C.green);
  tblHdr();

  const earningRows = [
    ["Basic Salary", payroll.basicSalary],
    ["Overtime Pay",  payroll.overtimePay],
    ...(payroll.allowances || []).map((a) => [
      `Allowance – ${(a.reason||"").replace(/_/g," ")}${a.note ? `  (${a.note})` : ""}`,
      a.amount,
    ]),
  ];
  earningRows.forEach(([d, a], i) => tblRow(d, a, i, C.greenLt));
  tblTotal("GROSS SALARY", payroll.grossSalary, C.greenBar, C.green);

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. DEDUCTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  secHdr("DEDUCTIONS", C.red);
  tblHdr();

  const deductionRows = [
    ...(payroll.deductions || []).map((d) => [
      `Deduction – ${(d.reason||"").replace(/_/g," ")}${d.note ? `  (${d.note})` : ""}`,
      d.amount,
    ]),
    ...(payroll.advanceRecovered > 0 ? [["Advance Recovery", payroll.advanceRecovered]] : []),
  ];

  if (!deductionRows.length) {
    doc.rect(ML, curY, MW, 18).fillAndStroke(C.white, C.border);
    txt("No deductions for this period", ML+10, curY+5, { size:8, color:C.slateL });
    curY += 18;
  } else {
    deductionRows.forEach(([d, a], i) => tblRow(d, a, i, C.redLt));
  }
  tblTotal("TOTAL DEDUCTIONS", payroll.totalDeductions, C.redBar, C.red);

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. ADVANCE PANEL
  // ═══════════════════════════════════════════════════════════════════════════
  if (payroll.advancePaid > 0) {
    const advH = 48;
    doc.rect(ML, curY, MW, advH).fillAndStroke(C.goldLt, C.goldMid);
    box(ML, curY, 3, advH, C.gold);
    const outstanding = (payroll.advancePaid||0) - (payroll.advanceRecovered||0);
    txt("ADVANCE INFORMATION",                    ML+10,       curY+8,  { size:8.5, bold:true, color:C.navy });
    txt(`Total Advance:   ${fmt(payroll.advancePaid)}`,   ML+10,       curY+24, { size:8, color:C.slate });
    txt(`Recovered:   ${fmt(payroll.advanceRecovered||0)}`, ML+MW/2,   curY+24, { size:8, color:C.slate });
    txt(`Outstanding Balance:   ${fmt(outstanding)}`,     ML+10,       curY+38, { size:8, bold:true, color:C.red });
    curY += advH + 12;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. NET SALARY
  // ═══════════════════════════════════════════════════════════════════════════
  const netH = 64;
  box(ML+3, curY+3, MW, netH, C.shadow);     // shadow
  box(ML, curY, MW, netH, C.navy);
  box(ML, curY, MW, 2, C.gold);              // gold top line
  box(ML, curY+netH-2, MW, 2, C.gold);      // gold bottom line

  txt("NET SALARY PAYABLE", ML, curY+14, { size:9, color:C.muted, align:"center", width:MW });
  txt(fmt(payroll.netSalary), ML, curY+30, { size:28, bold:true, color:C.gold, align:"center", width:MW });
  curY += netH + 14;

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. REMARKS
  // ═══════════════════════════════════════════════════════════════════════════
  if (payroll.remarks) {
    const remH = 34;
    doc.rect(ML, curY, MW, remH).fillAndStroke(C.smoke, C.border);
    box(ML, curY, 3, remH, C.teal);
    txt("REMARKS:", ML+10, curY+12, { size:8, bold:true, color:C.teal });
    txt(payroll.remarks, ML+80, curY+12, { size:8, color:C.slate });
    curY += remH + 12;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. SIGNATURE LINES
  // ═══════════════════════════════════════════════════════════════════════════
  if (curY < PH - 110) {
    curY += 8;
    const sigW = (MW - 48) / 3;
    ["Prepared By", "Verified By", "Authorised By"].forEach((lbl, i) => {
      const sx = ML + i * (sigW + 24);
      hline(sx, curY+36, sx+sigW, C.navy, 0.8);
      doc.circle(sx+sigW/2, curY+22, 12).stroke(C.border);
      txt(lbl, sx, curY+46, { size:7, color:C.slateL, align:"center", width:sigW });
    });
    curY += 58;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. FOOTER
  // ═══════════════════════════════════════════════════════════════════════════
  const footH = 38;
  box(0, PH-footH, PW, footH, C.footer);
  hline(0, PH-footH, PW, C.gold, 1.5);
  txt(
    "This is a computer-generated document and does not require a physical signature.",
    ML, PH-footH+8, { size:6.5, color:C.slateL, align:"center", width:MW }
  );
  txt(
    `Generated: ${new Date().toLocaleString("en-IN")}   ·   Payroll ID: ${payroll._id}`,
    ML, PH-footH+22, { size:6.5, color:C.slateL, align:"center", width:MW }
  );

  doc.end();
}