import PDFDocument from "pdfkit";
const fmt = (n) =>
  "Rs. " +
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

const C = {
  primary: "#1a3c5e",
  secondary: "#2d7dd2",
  lightBg: "#f0f4f8",
  border: "#c8d6e5",
  white: "#ffffff",
  textDark: "#1a1a2e",
  textMid: "#4a4a6a",
  green: "#1e8449",
  greenLt: "#a9dfbf",
  greenXl: "#d5f5e3",
  red: "#c0392b",
  redLt: "#f1948a",
  redXl: "#fadbd8",
  footerBg: "#e8f0fe",
  accentBlue: "#a8c8f0",
};

export function generateSalarySlipPDF(payroll, res) {
  // ----- Setup ---------------------------------------------------------------
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
    `attachment; filename="salary_slip_${payroll._id}.pdf"`,
  );
  doc.pipe(res);

  // ----- Dimensions ----------------------------------------------------------
  const PW = doc.page.width; // 595.28
  const PH = doc.page.height; // 841.89
  const M = 40; // margin
  const W = PW - 2 * M; // usable width

  // ── Tiny drawing primitives ────────────────────────────────────────────────
  const fillRect = (x, y, w, h, fill, stroke) => {
    doc
      .rect(x, y, w, h)
      .fillAndStroke(fill || C.white, stroke || fill || C.white);
  };

  const label = (text, x, y, opts = {}) => {
    doc
      .fillColor(opts.color || C.textMid)
      .font(opts.bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(opts.size || 8)
      .text(text, x, y, { lineBreak: false, ...opts.textOpts });
  };

  // ── 1. HEADER BANNER ───────────────────────────────────────────────────────
  fillRect(0, 0, PW, 88, C.primary);

  label("SALARY SLIP", M, 22, { color: C.white, bold: true, size: 22 });
  label("Official Payroll Document", M, 50, { color: C.accentBlue, size: 10 });

  const projectName = payroll.project?.projectName || "—";
  const siteName = payroll.project?.siteName || "—";

  doc
    .fillColor(C.white)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(projectName, M, 22, { width: W, align: "right", lineBreak: false });
  doc
    .fillColor(C.accentBlue)
    .font("Helvetica")
    .fontSize(9)
    .text(siteName, M, 40, { width: W, align: "right", lineBreak: false });

  // ── 2. PAY PERIOD BANNER ───────────────────────────────────────────────────
  fillRect(0, 88, PW, 28, C.secondary);
  doc
    .fillColor(C.white)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(
      `Pay Period: ${fmtDate(payroll.periodStart)} – ${fmtDate(payroll.periodEnd)}`,
      M,
      98,
      { width: W, align: "center", lineBreak: false },
    );

  let curY = 128;

  // ── 3. EMPLOYEE + PAYMENT CARDS ────────────────────────────────────────────
  const cardH = 132;
  const halfW = (W - 16) / 2;
  const rightX = M + halfW + 16;

  // Left card
  fillRect(M, curY, halfW, cardH, C.lightBg, C.border);
  doc
    .fillColor(C.primary)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("EMPLOYEE DETAILS", M + 10, curY + 10, { lineBreak: false });

  const user = payroll.user || {};
  [
    ["Name", user.name || "—"],
    ["Role", (payroll.role || "").replace(/_/g, " ").toUpperCase()],
    ["Email", user.email || "—"],
    ["Phone", String(user.phoneNumber || "—")],
    ["Aadhaar", user.adharNumber || "—"],
  ].forEach(([lbl, val], i) => {
    const ry = curY + 28 + i * 19;
    doc
      .fillColor(C.textMid)
      .font("Helvetica")
      .fontSize(8)
      .text(lbl + ":", M + 10, ry, { lineBreak: false });
    doc
      .fillColor(C.textDark)
      .font("Helvetica-Bold")
      .fontSize(8)
      .text(val, M + 85, ry, { lineBreak: false });
  });

  // Right card
  fillRect(rightX, curY, halfW, cardH, C.lightBg, C.border);
  doc
    .fillColor(C.primary)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("PAYMENT DETAILS", rightX + 10, curY + 10, { lineBreak: false });

  const statusColor =
    {
      paid: C.green,
      partially_paid: "#d4ac0d",
      pending: C.red,
    }[payroll.paymentStatus] || C.red;

  [
    ["Payroll ID", String(payroll._id).slice(-8).toUpperCase()],
    [
      "Status",
      (payroll.paymentStatus || "pending").replace(/_/g, " ").toUpperCase(),
    ],
    ["Payment Date", fmtDate(payroll.paymentDate)],
    ["Mode", (payroll.paymentMode || "—").replace(/_/g, " ").toUpperCase()],
    ["Txn Ref", payroll.transactionReference || "—"],
  ].forEach(([lbl, val], i) => {
    const ry = curY + 28 + i * 19;
    doc
      .fillColor(C.textMid)
      .font("Helvetica")
      .fontSize(8)
      .text(lbl + ":", rightX + 10, ry, { lineBreak: false });
    doc
      .fillColor(i === 1 ? statusColor : C.textDark)
      .font("Helvetica-Bold")
      .fontSize(8)
      .text(val, rightX + 85, ry, { lineBreak: false });
  });

  curY += cardH + 14;

  // ── 4. ATTENDANCE SUMMARY ──────────────────────────────────────────────────
  fillRect(M, curY, W, 24, C.primary);
  doc
    .fillColor(C.white)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("ATTENDANCE SUMMARY", M + 10, curY + 7, { lineBreak: false });
  curY += 24;

  const attItems = [
    ["Total Working Days", payroll.totalWorkingDays || 0],
    ["Days Present", payroll.presentDays || 0],
    ["Days Absent", payroll.absentDays || 0],
    ["Overtime Hours", payroll.overtimeHours || 0],
  ];
  const attW = W / attItems.length;
  fillRect(M, curY, W, 52, C.white, C.border);

  attItems.forEach(([lbl, val], i) => {
    const ax = M + i * attW;
    if (i > 0) {
      doc
        .moveTo(ax, curY)
        .lineTo(ax, curY + 52)
        .stroke(C.border);
    }
    doc
      .fillColor(C.secondary)
      .font("Helvetica-Bold")
      .fontSize(20)
      .text(String(val), ax, curY + 8, {
        width: attW,
        align: "center",
        lineBreak: false,
      });
    doc
      .fillColor(C.textMid)
      .font("Helvetica")
      .fontSize(8)
      .text(lbl, ax, curY + 34, {
        width: attW,
        align: "center",
        lineBreak: false,
      });
  });

  curY += 66;

  // ── 5. EARNINGS TABLE ──────────────────────────────────────────────────────
  const drawSectionHeader = (title, bgColor) => {
    fillRect(M, curY, W, 24, bgColor);
    doc
      .fillColor(C.white)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(title, M + 10, curY + 7, { lineBreak: false });
    curY += 24;
  };

  const drawTableHeader = (bgColor) => {
    fillRect(M, curY, W, 20, bgColor, C.border);
    doc
      .fillColor(C.primary)
      .font("Helvetica-Bold")
      .fontSize(9)
      .text("Description", M + 10, curY + 5, { lineBreak: false })
      .text("Amount", M + W - 100, curY + 5, {
        width: 90,
        align: "right",
        lineBreak: false,
      });
    curY += 20;
  };

  const drawTableRow = (desc, amt, i, altColor) => {
    const bg = i % 2 === 0 ? C.white : altColor;
    fillRect(M, curY, W, 20, bg, C.border);
    doc
      .fillColor(C.textDark)
      .font("Helvetica")
      .fontSize(9)
      .text(desc, M + 10, curY + 5, { lineBreak: false })
      .text(fmt(amt), M + W - 100, curY + 5, {
        width: 90,
        align: "right",
        lineBreak: false,
      });
    curY += 20;
  };

  const drawTotalRow = (lbl, val, bg, fg) => {
    fillRect(M, curY, W, 22, bg, C.border);
    doc
      .fillColor(fg)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(lbl, M + 10, curY + 6, { lineBreak: false })
      .text(fmt(val), M + W - 100, curY + 6, {
        width: 90,
        align: "right",
        lineBreak: false,
      });
    curY += 34;
  };

  // Earnings
  drawSectionHeader("EARNINGS", C.green);
  drawTableHeader(C.greenXl);

  const earningRows = [
    ["Basic Salary", payroll.basicSalary],
    ["Overtime Pay", payroll.overtimePay],
    ...(payroll.allowances || []).map((a) => [
      `Allowance – ${(a.reason || "").replace(/_/g, " ")}${a.note ? ` (${a.note})` : ""}`,
      a.amount,
    ]),
  ];
  earningRows.forEach(([d, a], i) => drawTableRow(d, a, i, "#f9fef9"));
  drawTotalRow("Gross Salary", payroll.grossSalary, C.greenLt, C.green);

  // ── 6. DEDUCTIONS TABLE ────────────────────────────────────────────────────
  drawSectionHeader("DEDUCTIONS", C.red);
  drawTableHeader(C.redXl);

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
    fillRect(M, curY, W, 20, C.white, C.border);
    doc
      .fillColor(C.textMid)
      .font("Helvetica")
      .fontSize(9)
      .text("No deductions for this period", M + 10, curY + 5, {
        lineBreak: false,
      });
    curY += 20;
  } else {
    deductionRows.forEach(([d, a], i) => drawTableRow(d, a, i, "#fef9f9"));
  }
  drawTotalRow("Total Deductions", payroll.totalDeductions, C.redLt, C.red);

  // ── 7. ADVANCE INFORMATION ─────────────────────────────────────────────────
  if (payroll.advancePaid > 0) {
    fillRect(M, curY, W, 52, C.lightBg, C.border);
    doc
      .fillColor(C.primary)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("ADVANCE INFORMATION", M + 10, curY + 8, { lineBreak: false });
    doc
      .fillColor(C.textMid)
      .font("Helvetica")
      .fontSize(9)
      .text(
        `Total Advance Given: ${fmt(payroll.advancePaid)}`,
        M + 10,
        curY + 26,
        { lineBreak: false },
      )
      .text(
        `Recovered This Period: ${fmt(payroll.advanceRecovered)}`,
        M + W / 2,
        curY + 26,
        { lineBreak: false },
      )
      .text(
        `Outstanding Balance: ${fmt(payroll.advancePaid - payroll.advanceRecovered)}`,
        M + 10,
        curY + 40,
        { lineBreak: false },
      );
    curY += 66;
  }

  // ── 8. NET SALARY BOX ──────────────────────────────────────────────────────
  fillRect(M, curY, W, 60, C.primary);
  doc
    .fillColor(C.accentBlue)
    .font("Helvetica")
    .fontSize(11)
    .text("NET SALARY PAYABLE", M, curY + 10, {
      width: W,
      align: "center",
      lineBreak: false,
    });
  doc
    .fillColor(C.white)
    .font("Helvetica-Bold")
    .fontSize(28)
    .text(fmt(payroll.netSalary), M, curY + 28, {
      width: W,
      align: "center",
      lineBreak: false,
    });
  curY += 74;

  // ── 9. REMARKS ─────────────────────────────────────────────────────────────
  if (payroll.remarks) {
    fillRect(M, curY, W, 38, C.lightBg, C.border);
    doc
      .fillColor(C.primary)
      .font("Helvetica-Bold")
      .fontSize(9)
      .text("REMARKS:", M + 10, curY + 10, { lineBreak: false });
    doc
      .fillColor(C.textMid)
      .font("Helvetica")
      .fontSize(9)
      .text(payroll.remarks, M + 85, curY + 10, {
        width: W - 95,
        lineBreak: false,
      });
    curY += 52;
  }

  // ── 10. AUTHORISATION SECTION ──────────────────────────────────────────────
  // Only if enough space remains (leave 100px for footer)
  if (curY < PH - 180) {
    curY += 16;
    const sigW = (W - 40) / 3;
    ["Prepared By", "Checked By", "Authorised By"].forEach((lbl, i) => {
      const sx = M + i * (sigW + 20);
      doc
        .moveTo(sx, curY + 40)
        .lineTo(sx + sigW, curY + 40)
        .stroke(C.border);
      doc
        .fillColor(C.textMid)
        .font("Helvetica")
        .fontSize(8)
        .text(lbl, sx, curY + 46, {
          width: sigW,
          align: "center",
          lineBreak: false,
        });
    });
  }

  // ── 11. FOOTER ─────────────────────────────────────────────────────────────
  const footerH = 46;
  fillRect(0, PH - footerH, PW, footerH, C.footerBg);
  doc
    .fillColor(C.textMid)
    .font("Helvetica")
    .fontSize(7)
    .text(
      "This is a computer-generated salary slip and does not require a physical signature.",
      M,
      PH - footerH + 10,
      { width: W, align: "center", lineBreak: false },
    )
    .text(
      `Generated: ${new Date().toLocaleString("en-IN")}   |   Payroll ID: ${payroll._id}`,
      M,
      PH - footerH + 25,
      { width: W, align: "center", lineBreak: false },
    );

  doc.end();
}
