import PDFDocument from "pdfkit";

const fmt = (n) =>
  "₹" +
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

// ─── PROFESSIONAL COLOR PALETTE ───────────────────────────────────────────────
const C = {
  navy:      "#0D1B2A",   // Deep navy – header bg
  gold:      "#C9A84C",   // Gold accent
  goldLt:    "#F5E6C0",   // Light gold tint
  teal:      "#1B6CA8",   // Section headers
  tealLt:    "#E8F4FD",   // Table alt rows
  slate:     "#445566",   // Body text
  smoke:     "#F7F9FB",   // Light bg
  white:     "#FFFFFF",
  border:    "#CBD8E5",
  green:     "#1A7A4A",
  greenLt:   "#E6F5EE",
  greenBar:  "#A8D5B5",
  red:       "#B02A2A",
  redLt:     "#FDEAEA",
  redBar:    "#E8AAAA",
  footer:    "#EEF3F8",
  divider:   "#D0DCE8",
  mutedBlue: "#A0B8CC",
};

export function generateSalarySlipPDF(payroll, res) {
  // ─── Setup ──────────────────────────────────────────────────────────────────
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    info: {
      Title: `Salary Slip – ${payroll._id}`,
      Author: "Payroll System",
    },
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="salary_slip_${payroll._id}.pdf"`
  );
  doc.pipe(res);

  const PW = doc.page.width;   // 595.28
  const PH = doc.page.height;  // 841.89
  const ML = 28;               // left/right margin
  const MW = PW - 2 * ML;     // usable width

  // ── Drawing primitives ──────────────────────────────────────────────────────
  const fillRect = (x, y, w, h, fill, stroke) => {
    doc.rect(x, y, w, h).fillAndStroke(fill || C.white, stroke || fill || C.white);
  };

  const txt = (text, x, y, opts = {}) => {
    doc
      .fillColor(opts.color || C.slate)
      .font(opts.bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(opts.size || 8)
      .text(String(text), x, y, { lineBreak: false, ...opts.textOpts });
  };

  // ── 1. HEADER ───────────────────────────────────────────────────────────────
  // Navy background
  fillRect(0, 0, PW, 95, C.navy);

  // Gold top accent stripe
  fillRect(0, 0, PW, 4, C.gold);

  // Gold left vertical bar
  fillRect(ML, 10, 4, 75, C.gold);

  // Company / Project name
  txt(
    payroll.project?.projectName || "Company Name",
    ML + 14, 20,
    { color: C.white, bold: true, size: 20 }
  );
  txt(
    payroll.project?.siteName || "Site / Branch",
    ML + 14, 46,
    { color: C.mutedBlue, size: 9 }
  );

  // SALARY SLIP label (right aligned)
  doc
    .fillColor(C.gold)
    .font("Helvetica-Bold")
    .fontSize(15)
    .text("SALARY SLIP", ML, 22, { width: MW, align: "right", lineBreak: false });

  doc
    .fillColor(C.mutedBlue)
    .font("Helvetica")
    .fontSize(8)
    .text("CONFIDENTIAL – FOR RECIPIENT ONLY", ML, 44, {
      width: MW,
      align: "right",
      lineBreak: false,
    });

  // Pay period banner
  fillRect(0, 95, PW, 17, C.gold);
  doc
    .fillColor(C.navy)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(
      `PAY PERIOD:  ${fmtDate(payroll.periodStart)}  –  ${fmtDate(payroll.periodEnd)}`,
      ML, 100,
      { width: MW, align: "center", lineBreak: false }
    );

  let curY = 126;

  // ── 2. EMPLOYEE + PAYMENT CARDS ─────────────────────────────────────────────
  const cardH = 120;
  const colW  = (MW - 12) / 2;
  const rightX = ML + colW + 12;

  const drawCard = (cx, cy, cw, ch, title) => {
    // Shadow
    fillRect(cx + 2, cy + 2, cw, ch, "#D0D8E0");
    // Card
    doc.rect(cx, cy, cw, ch).fillAndStroke(C.white, C.border);
    // Title bar
    fillRect(cx, cy, cw, 22, C.teal);
    // Gold accent stripe
    fillRect(cx, cy, 3, 22, C.gold);
    txt(title, cx + 10, cy + 7, { color: C.white, bold: true, size: 9 });
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
    const ry = curY + 30 + i * 18;
    txt(lbl + ":", ML + 8, ry, { color: C.slate, size: 7.5 });
    txt(val, ML + 70, ry, { color: C.navy, bold: true, size: 7.5 });
  });

  const statusColors = {
    paid:            C.green,
    partially_paid:  "#B8860B",
    pending:         C.red,
  };
  const statusColor = statusColors[payroll.paymentStatus] || C.red;

  [
    ["Payroll ID", String(payroll._id).slice(-8).toUpperCase(), null],
    ["Status",     (payroll.paymentStatus || "pending").replace(/_/g, " ").toUpperCase(), statusColor],
    ["Pay Date",   fmtDate(payroll.paymentDate), null],
    ["Mode",       (payroll.paymentMode || "—").replace(/_/g, " ").toUpperCase(), null],
    ["Txn Ref",    payroll.transactionReference || "—", null],
  ].forEach(([lbl, val, col], i) => {
    const ry = curY + 30 + i * 18;
    txt(lbl + ":", rightX + 8, ry, { color: C.slate, size: 7.5 });
    txt(val, rightX + 70, ry, { color: col || C.navy, bold: true, size: 7.5 });
  });

  curY += cardH + 16;

  // ── 3. ATTENDANCE SUMMARY ───────────────────────────────────────────────────
  const sectionHeader = (title, bg) => {
    fillRect(ML, curY, MW, 22, bg);
    fillRect(ML, curY, 4, 22, C.gold);
    txt(title, ML + 12, curY + 7, { color: C.white, bold: true, size: 9.5 });
    curY += 22;
  };

  sectionHeader("ATTENDANCE SUMMARY", C.navy);

  const attItems = [
    ["Total Working Days", payroll.totalWorkingDays || 0],
    ["Days Present",       payroll.presentDays || 0],
    ["Days Absent",        payroll.absentDays || 0],
    ["Overtime Hours",     payroll.overtimeHours || 0],
  ];
  const attH  = 56;
  const attCW = MW / attItems.length;

  doc.rect(ML, curY, MW, attH).fillAndStroke(C.smoke, C.border);

  attItems.forEach(([lbl, val], i) => {
    const ax = ML + i * attCW;
    if (i > 0) {
      doc.moveTo(ax, curY).lineTo(ax, curY + attH).stroke(C.divider);
    }
    doc
      .fillColor(C.teal)
      .font("Helvetica-Bold")
      .fontSize(24)
      .text(String(val), ax, curY + 10, {
        width: attCW,
        align: "center",
        lineBreak: false,
      });
    doc
      .fillColor(C.slate)
      .font("Helvetica")
      .fontSize(7)
      .text(lbl, ax, curY + 40, {
        width: attCW,
        align: "center",
        lineBreak: false,
      });
  });

  curY += attH + 14;

  // ── 4. TABLE HELPERS ────────────────────────────────────────────────────────
  const drawTableHeader = (altBg) => {
    doc.rect(ML, curY, MW, 18).fillAndStroke(altBg, C.border);
    doc.fillColor(C.teal).font("Helvetica-Bold").fontSize(8)
      .text("DESCRIPTION", ML + 10, curY + 5, { lineBreak: false });
    doc.fillColor(C.teal).font("Helvetica-Bold").fontSize(8)
      .text("AMOUNT", ML + MW - 100, curY + 5, {
        width: 90,
        align: "right",
        lineBreak: false,
      });
    curY += 18;
  };

  const drawTableRow = (desc, amt, idx, altColor) => {
    const bg = idx % 2 === 0 ? C.white : altColor;
    doc.rect(ML, curY, MW, 18).fillAndStroke(bg, C.border);
    doc.fillColor(C.slate).font("Helvetica").fontSize(8.5)
      .text(desc, ML + 10, curY + 5, { lineBreak: false });
    doc.fillColor(C.navy).font("Helvetica-Bold").fontSize(8.5)
      .text(fmt(amt), ML + MW - 100, curY + 5, {
        width: 90,
        align: "right",
        lineBreak: false,
      });
    curY += 18;
  };

  const drawTotalRow = (lbl, val, bg, fg) => {
    doc.rect(ML, curY, MW, 22).fillAndStroke(bg, C.border);
    fillRect(ML, curY, 4, 22, C.gold);
    doc.fillColor(fg).font("Helvetica-Bold").fontSize(10)
      .text(lbl, ML + 12, curY + 6, { lineBreak: false });
    doc.fillColor(fg).font("Helvetica-Bold").fontSize(10)
      .text(fmt(val), ML + MW - 100, curY + 6, {
        width: 90,
        align: "right",
        lineBreak: false,
      });
    curY += 34;
  };

  // ── 5. EARNINGS ─────────────────────────────────────────────────────────────
  sectionHeader("EARNINGS", C.green);
  drawTableHeader(C.tealLt);

  const earningRows = [
    ["Basic Salary", payroll.basicSalary],
    ["Overtime Pay",  payroll.overtimePay],
    ...(payroll.allowances || []).map((a) => [
      `Allowance – ${(a.reason || "").replace(/_/g, " ")}${a.note ? ` (${a.note})` : ""}`,
      a.amount,
    ]),
  ];
  earningRows.forEach(([d, a], i) => drawTableRow(d, a, i, C.greenLt));
  drawTotalRow("GROSS SALARY", payroll.grossSalary, C.greenBar, C.green);

  // ── 6. DEDUCTIONS ───────────────────────────────────────────────────────────
  sectionHeader("DEDUCTIONS", C.red);
  drawTableHeader(C.tealLt);

  const deductionRows = [
    ...(payroll.deductions || []).map((d) => [
      `Deduction – ${(d.reason || "").replace(/_/g, " ")}${d.note ? ` (${d.note})` : ""}`,
      d.amount,
    ]),
    ...(payroll.advanceRecovered > 0
      ? [["Advance Recovery", payroll.advanceRecovered]]
      : []),
  ];

  if (deductionRows.length === 0) {
    doc.rect(ML, curY, MW, 18).fillAndStroke(C.white, C.border);
    txt("No deductions for this period", ML + 10, curY + 5, { color: C.slate });
    curY += 18;
  } else {
    deductionRows.forEach(([d, a], i) => drawTableRow(d, a, i, C.redLt));
  }
  drawTotalRow("TOTAL DEDUCTIONS", payroll.totalDeductions, C.redBar, C.red);

  // ── 7. ADVANCE PANEL ────────────────────────────────────────────────────────
  if (payroll.advancePaid > 0) {
    const advH = 50;
    doc.rect(ML, curY, MW, advH).fillAndStroke(C.goldLt, C.gold);
    txt("ADVANCE INFORMATION", ML + 10, curY + 8, {
      color: C.navy,
      bold: true,
      size: 9,
    });
    const outstanding = (payroll.advancePaid || 0) - (payroll.advanceRecovered || 0);
    txt(`Total Advance Given:  ${fmt(payroll.advancePaid)}`, ML + 10, curY + 26, {
      color: C.slate,
      size: 8.5,
    });
    txt(`Recovered This Period:  ${fmt(payroll.advanceRecovered)}`, ML + MW / 2, curY + 26, {
      color: C.slate,
      size: 8.5,
    });
    txt(`Outstanding Balance:  ${fmt(outstanding)}`, ML + 10, curY + 40, {
      color: C.slate,
      size: 8.5,
    });
    curY += advH + 12;
  }

  // ── 8. NET SALARY BOX ───────────────────────────────────────────────────────
  const netH = 68;
  fillRect(ML, curY, MW, netH, C.navy);
  fillRect(ML, curY, MW, 3, C.gold);
  fillRect(ML, curY + netH - 3, MW, 3, C.gold);

  doc
    .fillColor(C.mutedBlue)
    .font("Helvetica")
    .fontSize(9)
    .text("NET SALARY PAYABLE", ML, curY + 12, {
      width: MW,
      align: "center",
      lineBreak: false,
    });
  doc
    .fillColor(C.gold)
    .font("Helvetica-Bold")
    .fontSize(30)
    .text(fmt(payroll.netSalary), ML, curY + 28, {
      width: MW,
      align: "center",
      lineBreak: false,
    });

  curY += netH + 14;

  // ── 9. REMARKS ──────────────────────────────────────────────────────────────
  if (payroll.remarks) {
    const remH = 36;
    doc.rect(ML, curY, MW, remH).fillAndStroke(C.smoke, C.border);
    txt("REMARKS:", ML + 10, curY + 10, { color: C.teal, bold: true, size: 8.5 });
    txt(payroll.remarks, ML + 80, curY + 10, {
      color: C.slate,
      size: 8.5,
      textOpts: { width: MW - 95, lineBreak: false },
    });
    curY += remH + 12;
  }

  // ── 10. SIGNATURE LINES ─────────────────────────────────────────────────────
  if (curY < PH - 130) {
    curY += 10;
    const sigW = (MW - 40) / 3;
    ["Prepared By", "Verified By", "Authorised By"].forEach((lbl, i) => {
      const sx = ML + i * (sigW + 20);
      doc
        .moveTo(sx, curY + 36)
        .lineTo(sx + sigW, curY + 36)
        .strokeColor(C.navy)
        .lineWidth(0.8)
        .stroke();
      doc
        .fillColor(C.slate)
        .font("Helvetica")
        .fontSize(7.5)
        .text(lbl, sx, curY + 44, {
          width: sigW,
          align: "center",
          lineBreak: false,
        });
    });
  }

  // ── 11. FOOTER ──────────────────────────────────────────────────────────────
  const footerH = 40;
  fillRect(0, PH - footerH, PW, footerH, C.footer);
  fillRect(0, PH - footerH, PW, 1, C.gold);

  doc
    .fillColor(C.slate)
    .font("Helvetica")
    .fontSize(6.5)
    .text(
      "This is a computer-generated salary slip and does not require a physical signature.",
      ML, PH - footerH + 10,
      { width: MW, align: "center", lineBreak: false }
    )
    .text(
      `Generated: ${new Date().toLocaleString("en-IN")}   |   Payroll ID: ${payroll._id}`,
      ML, PH - footerH + 24,
      { width: MW, align: "center", lineBreak: false }
    );

  doc.end();
}