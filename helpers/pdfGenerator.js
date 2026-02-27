import PDFDocument from "pdfkit";

// ─── Constants & Colors ──────────────────────────────────────────────
const C = {
  primary: "#1a3c5e", // Dark Blue
  secondary: "#2c3e50", // Dark Grey/Blue
  accent: "#2980b9", // Bright Blue
  accentLight: "#d6eaf8", // Very Light Blue
  bgLight: "#f4f6f8", // Light Grey Background
  white: "#ffffff",
  text: "#333333",
  muted: "#7f8c8d",
  border: "#dce1e7",
  rowAlt: "#f8f9fa", // Alternating row color
  success: "#27ae60",
  successBg: "#eafaf1",
  warning: "#f39c12",
  danger: "#c0392b",
};

const MARGIN = 40;
const PAGE_W = 595.28; // A4 Width
const CONTENT_W = PAGE_W - MARGIN * 2;
const BOTTOM_THRESHOLD = 80;

// ─── Formatters ──────────────────────────────────────────────────────
const formatCurrency = (n) => `Rs. ${Number(n || 0).toLocaleString("en-IN")}`;

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "N/A";

const capitalize = (s) =>
  String(s || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

// ─── Drawing Helpers ─────────────────────────────────────────────────

// Check if we need a new page. Returns the valid Y position.
const checkPageBreak = (doc, y, heightNeeded, project, drawHeaderFn) => {
  if (y + heightNeeded > doc.page.height - BOTTOM_THRESHOLD) {
    doc.addPage();
    drawHeaderFn(doc, project);
    return 110; // Return top Y position after header
  }
  return y;
};

const drawRect = (doc, x, y, w, h, color, radius = 0) => {
  doc.save();
  if (radius > 0) doc.roundedRect(x, y, w, h, radius);
  else doc.rect(x, y, w, h);
  doc.fill(color).restore();
};

const drawSectionHeader = (doc, title, y) => {
  drawRect(doc, MARGIN, y, CONTENT_W, 24, C.primary, 2);
  doc
    .fillColor(C.white)
    .fontSize(10)
    .font("Helvetica-Bold")
    .text(title.toUpperCase(), MARGIN + 10, y + 7, { lineBreak: false });
  return y + 34;
};

const drawKV = (doc, key, value, x, y, labelWidth = 100) => {
  doc
    .fillColor(C.muted)
    .fontSize(8)
    .font("Helvetica-Bold")
    .text(key + ":", x, y, { width: labelWidth, lineBreak: false });
  doc
    .fillColor(C.text)
    .fontSize(8)
    .font("Helvetica")
    .text(String(value), x + labelWidth, y, {
      lineBreak: false,
      ellipsis: true,
      width: 180,
    });
};

const drawBadge = (doc, text, x, y, bgColor) => {
  const width = 80;
  drawRect(doc, x, y - 2, width, 14, bgColor, 4);
  doc
    .fillColor(C.white)
    .fontSize(7)
    .font("Helvetica-Bold")
    .text(text.toUpperCase(), x, y + 1, {
      width: width,
      align: "center",
      lineBreak: false,
    });
};

// ─── Main Header ─────────────────────────────────────────────────────
const drawHeader = (doc, project) => {
  drawRect(doc, 0, 0, PAGE_W, 85, C.primary);
  drawRect(doc, 0, 85, PAGE_W, 4, C.accent);

  doc
    .fillColor(C.white)
    .fontSize(22)
    .font("Helvetica-Bold")
    .text("PROJECT PROPOSAL", MARGIN, 20, { lineBreak: false });

  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor(C.accentLight)
    .text("Confidential — Prepared exclusively for the client", MARGIN, 50, {
      lineBreak: false,
    });

  doc.fontSize(8).text(`Generated: ${formatDate(new Date())}`, MARGIN, 64, {
    lineBreak: false,
  });

  doc
    .fillColor(C.white)
    .fontSize(12)
    .font("Helvetica-Bold")
    .text(project.projectName || "Unnamed Project", PAGE_W - 250, 20, {
      width: 210,
      align: "right",
      lineBreak: false,
      ellipsis: true,
    });

  doc
    .fillColor(C.accentLight)
    .fontSize(9)
    .font("Helvetica")
    .text(`Site: ${project.siteName || "N/A"}`, PAGE_W - 250, 40, {
      width: 210,
      align: "right",
      lineBreak: false,
      ellipsis: true,
    });

  doc
    .fillColor(C.accentLight)
    .fontSize(7)
    .text(`ID: ${project._id}`, PAGE_W - 250, 55, {
      width: 210,
      align: "right",
      lineBreak: false,
    });
};

// ─── Footer ──────────────────────────────────────────────────────────
const drawFooter = (doc, pageNumber) => {
  const y = doc.page.height - 30;
  drawRect(doc, 0, y - 5, PAGE_W, 35, C.bgLight);
  doc
    .moveTo(0, y - 5)
    .lineTo(PAGE_W, y - 5)
    .lineWidth(0.5)
    .strokeColor(C.border)
    .stroke();

  doc
    .fillColor(C.muted)
    .fontSize(8)
    .text(`Page ${pageNumber}`, MARGIN, y + 8, {
      width: CONTENT_W,
      align: "center",
      lineBreak: false,
    });
};

// ─── Thank You Page ──────────────────────────────────────────────────

const drawThankYouPage = (doc, project) => {
  // Check if we're already at the start of a new page or if we need to add one
  // Only add a new page if the current page has content (y > 110 indicates content exists)
  if (doc.page && doc.y > 110) {
    doc.addPage();
  }

  drawRect(doc, 0, 0, PAGE_W, doc.page.height, C.primary);
  drawRect(doc, 0, doc.page.height - 10, PAGE_W, 10, C.accent);

  const midY = doc.page.height / 2 - 50;

  doc
    .fillColor(C.white)
    .fontSize(35)
    .font("Helvetica-Bold")
    .text("Thank You!", 0, midY, { 
      align: "center",
      width: PAGE_W  // Add width to ensure centering works properly
    });

  doc
    .fillColor(C.accentLight)
    .fontSize(12)
    .font("Helvetica")
    .text("We appreciate your confidence in our team.", 0, midY + 50, {
      align: "center",
      width: PAGE_W  // Add width to ensure centering works properly
    });
  doc.text(
    "Delivering quality and excellence is our commitment.",
    0,
    midY + 70,
    { 
      align: "center",
      width: PAGE_W  // Add width to ensure centering works properly
    },
  );

  doc
    .moveTo(MARGIN + 40, midY + 110)
    .lineTo(PAGE_W - MARGIN - 40, midY + 110)
    .strokeColor(C.accent)
    .lineWidth(1)
    .stroke();

  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .fillColor(C.white)
    .text(`Project: ${project.projectName}`, 0, midY + 130, {
      align: "center",
      width: PAGE_W  // Add width to ensure centering works properly
    });

  doc.text(
    `Total Value: ${formatCurrency(project.finalProjectTotal)}`,
    0,
    midY + 150,
    { 
      align: "center",
      width: PAGE_W  // Add width to ensure centering works properly
    },
  );

  if (project.createdBy) {
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor(C.accentLight)
      .text(
        `Prepared by: ${project.createdBy.name} | ${project.createdBy.email}`,
        0,
        midY + 180,
        { 
          align: "center",
          width: PAGE_W  // Add width to ensure centering works properly
        },
      );

    if (project.createdBy.phoneNumber) {
      doc.text(project.createdBy.phoneNumber, 0, midY + 195, {
        align: "center",
        width: PAGE_W  // Add width to ensure centering works properly
      });
    }
  }
};
// ─────────────────────────────────────────────────────────────────────
// ─── PDF GENERATION FUNCTION ─────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────
export const generateProjectProposalPDF = (project) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: MARGIN,
      autoFirstPage: false,
      bufferPages: true,
    });

    const buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // Initial Page
    doc.addPage();
    drawHeader(doc, project);

    let y = 110;

    // 1. PROJECT OVERVIEW
    y = drawSectionHeader(doc, "PROJECT OVERVIEW", y);
    const col1X = MARGIN + 5;
    const col2X = PAGE_W / 2 + 10;

    const overviewData = [
      {
        l: "Project Name",
        lv: project.projectName,
        r: "Status",
        rv: project.projectStatus,
      },
      {
        l: "Site Name",
        lv: project.siteName,
        r: "Approval",
        rv: project.approvalStatus,
      },
      {
        l: "Area",
        lv: `${project.area || 0} sq. ft.`,
        r: "Progress",
        rv: `${project.progressPercentage}%`,
      },
      {
        l: "Start Date",
        lv: formatDate(project.startDate),
        r: "Created By",
        rv: project.createdBy?.name || "-",
      },
      {
        l: "Expected End",
        lv: formatDate(project.expectedEndDate),
        r: "Created On",
        rv: formatDate(project.createdAt),
      },
    ];

    overviewData.forEach((row, i) => {
      if (i % 2 === 0) drawRect(doc, MARGIN, y - 2, CONTENT_W, 16, C.rowAlt);
      drawKV(doc, row.l, row.lv, col1X, y);
      drawKV(doc, row.r, row.rv, col2X, y);
      y += 18;
    });

    y += 5;
    const statusColor =
      project.projectStatus === "completed" ? C.success : C.warning;
    drawBadge(doc, project.projectStatus || "Planning", MARGIN, y, statusColor);

    const approvalColor =
      project.approvalStatus === "approved" ? C.success : C.danger;
    drawBadge(
      doc,
      project.approvalStatus || "Pending",
      MARGIN + 90,
      y,
      approvalColor,
    );
    y += 30;

    // 2. SITE LOCATION
    y = checkPageBreak(doc, y, 100, project, drawHeader);
    y = drawSectionHeader(doc, "SITE LOCATION", y);

    const loc = project.location || {};
    const locData = [
      { l: "Address", lv: loc.address, r: "Pincode", rv: loc.pincode },
      { l: "City", lv: loc.city, r: "State", rv: loc.state },
    ];

    locData.forEach((row, i) => {
      if (i % 2 === 0) drawRect(doc, MARGIN, y - 2, CONTENT_W, 16, C.rowAlt);
      drawKV(doc, row.l, row.lv, col1X, y);
      drawKV(doc, row.r, row.rv, col2X, y);
      y += 18;
    });

    if (loc.coordinates?.coordinates) {
      const [lng, lat] = loc.coordinates.coordinates;
      drawKV(doc, "Coordinates", `Lat: ${lat}, Lng: ${lng}`, col1X, y);
      y += 25;
    } else {
      y += 10;
    }

    // 3. PROJECT PHASES
    if (project.phases && project.phases.length > 0) {
      y = checkPageBreak(doc, y, 60, project, drawHeader);
      y = drawSectionHeader(doc, "PROJECT PHASES", y);

      project.phases.forEach((phase, i) => {
        y = checkPageBreak(doc, y, 25, project, drawHeader);
        if (i % 2 === 0) drawRect(doc, MARGIN, y - 2, CONTENT_W, 20, C.rowAlt);

        doc
          .fillColor(C.secondary)
          .fontSize(9)
          .font("Helvetica-Bold")
          .text(phase.phaseName, MARGIN + 5, y + 3, {
            width: 120,
            lineBreak: false,
            ellipsis: true,
          });

        const barX = MARGIN + 130;
        const barW = 250;
        drawRect(doc, barX, y + 5, barW, 8, "#e0e0e0", 4);
        const fillW = (phase.completionPercentage / 100) * barW;
        if (fillW > 0) drawRect(doc, barX, y + 5, fillW, 8, C.success, 4);

        doc
          .fontSize(8)
          .fillColor(C.text)
          .text(`${phase.completionPercentage}%`, barX + barW + 10, y + 4, {
            lineBreak: false,
          });

        const pStatus = phase.isCompleted ? "COMPLETE" : "IN PROGRESS";
        drawBadge(
          doc,
          pStatus,
          PAGE_W - MARGIN - 85,
          y + 2,
          phase.isCompleted ? C.success : C.warning,
        );
        y += 22;
      });
      y += 15;
    }

    // 4. FINANCIAL SUMMARY
    y = checkPageBreak(doc, y, 150, project, drawHeader);
    y = drawSectionHeader(doc, "FINANCIAL SUMMARY", y);

    const cardWidth = CONTENT_W / 2 - 10;
    const cardHeight = 60;

    const attrSetTotal =
      project.attributeSets?.reduce(
        (acc, set) => acc + (set.setTotal || 0),
        0,
      ) || 0;
    const directTotal =
      project.attributes?.reduce(
        (acc, item) =>
          acc + (item.quantity || 1) * (item.attribute?.pricing || 0),
        0,
      ) || 0;

    const cards = [
      {
        title: "Attribute Sets Total",
        value: attrSetTotal,
        color: C.accentLight,
        text: C.primary,
      },
      {
        title: "Direct Materials Total",
        value: directTotal,
        color: "#e8f5e9",
        text: C.success,
      },
      {
        title: "Extra / Additional Cost",
        value: project.extracost,
        color: "#fff3e0",
        text: C.warning,
      },
      {
        title: "TOTAL PROJECT VALUE",
        value: project.finalProjectTotal,
        color: C.primary,
        text: C.white,
        bold: true,
      },
    ];

    let cx = MARGIN;
    let cy = y;

    cards.forEach((card, i) => {
      drawRect(doc, cx, cy, cardWidth, cardHeight, card.color, 4);
      drawRect(doc, cx, cy, 4, cardHeight, card.bold ? C.accent : card.text, 0);

      doc
        .fillColor(card.bold ? C.accentLight : C.muted)
        .fontSize(8)
        .font("Helvetica-Bold")
        .text(card.title, cx + 15, cy + 10, { lineBreak: false });

      doc
        .fillColor(card.text)
        .fontSize(16)
        .font("Helvetica-Bold")
        .text(formatCurrency(card.value), cx + 15, cy + 30, {
          lineBreak: false,
        });

      if (i % 2 === 0) {
        cx += cardWidth + 20;
      } else {
        cx = MARGIN;
        cy += cardHeight + 15;
      }
    });
    y = cy + 10;

    // 5. MATERIAL ATTRIBUTE SETS
    if (project.attributeSets && project.attributeSets.length > 0) {
      y = checkPageBreak(doc, y, 50, project, drawHeader);
      y = drawSectionHeader(doc, "MATERIAL ATTRIBUTE SETS", y);

      project.attributeSets.forEach((set) => {
        y = checkPageBreak(doc, y, 60, project, drawHeader);

        doc
          .fillColor(C.primary)
          .fontSize(10)
          .font("Helvetica-Bold")
          .text(
            `${set.name} — Total: ${formatCurrency(set.setTotal)}`,
            MARGIN,
            y,
            { lineBreak: false },
          );
        y += 15;

        const drawTableHeader = (d, curY) => {
          drawRect(d, MARGIN, curY, CONTENT_W, 18, C.accentLight);
          d.fillColor(C.primary).fontSize(8).font("Helvetica-Bold");
          d.text("Material", MARGIN + 5, curY + 5, {
            width: 190,
            lineBreak: false,
          });
          d.text("Type", MARGIN + 200, curY + 5, {
            width: 100,
            lineBreak: false,
          });
          d.text("Unit Price", PAGE_W - MARGIN - 60, curY + 5, {
            align: "right",
            width: 50,
            lineBreak: false,
          });
          return curY + 20;
        };

        y = drawTableHeader(doc, y);

        if (set.attributes) {
          set.attributes.forEach((attr, idx) => {
            y = checkPageBreak(doc, y, 15, project, drawHeader);
            if (y === 110) y = drawTableHeader(doc, y);

            if (idx % 2 === 0)
              drawRect(doc, MARGIN, y - 2, CONTENT_W, 15, C.rowAlt);

            doc.fillColor(C.text).fontSize(8).font("Helvetica");
            doc.text(attr.label, MARGIN + 5, y, {
              width: 190,
              lineBreak: false,
              ellipsis: true,
            });
            doc.text(capitalize(attr.type), MARGIN + 200, y, {
              width: 100,
              lineBreak: false,
              ellipsis: true,
            });
            doc.text(formatCurrency(attr.pricing), PAGE_W - MARGIN - 60, y, {
              align: "right",
              width: 50,
              lineBreak: false,
            });

            y += 15;
          });
        }
        y += 15;
      });
    }

    // 6. DIRECT MATERIALS
    if (project.attributes && project.attributes.length > 0) {
      y = checkPageBreak(doc, y, 60, project, drawHeader);
      y = drawSectionHeader(doc, "DIRECT MATERIALS (with Quantity & Total)", y);

      const drawDirectHeader = (d, curY) => {
        drawRect(d, MARGIN, curY, CONTENT_W, 18, C.accentLight);
        d.fillColor(C.primary).fontSize(8).font("Helvetica-Bold");
        d.text("#", MARGIN + 5, curY + 5, { width: 20, lineBreak: false });
        d.text("Material", MARGIN + 30, curY + 5, {
          width: 160,
          lineBreak: false,
        });
        d.text("Type", MARGIN + 200, curY + 5, { width: 90, lineBreak: false });
        d.text("Qty", MARGIN + 300, curY + 5, { width: 40, lineBreak: false });
        d.text("Unit Price", MARGIN + 350, curY + 5, {
          width: 60,
          lineBreak: false,
        });
        d.text("Total", PAGE_W - MARGIN - 60, curY + 5, {
          align: "right",
          width: 50,
          lineBreak: false,
        });
        return curY + 20;
      };

      y = drawDirectHeader(doc, y);
      let directSum = 0;

      project.attributes.forEach((item, idx) => {
        y = checkPageBreak(doc, y, 15, project, drawHeader);
        if (y === 110) y = drawDirectHeader(doc, y);

        if (idx % 2 === 0)
          drawRect(doc, MARGIN, y - 2, CONTENT_W, 15, C.rowAlt);

        const qty = item.quantity || 1;
        const price = item.attribute?.pricing || 0;
        const total = qty * price;
        directSum += total;

        doc.fillColor(C.text).fontSize(8).font("Helvetica");
        doc.text(idx + 1, MARGIN + 5, y, { width: 20, lineBreak: false });
        doc.text(item.attribute?.label, MARGIN + 30, y, {
          width: 160,
          lineBreak: false,
          ellipsis: true,
        });
        doc.text(capitalize(item.attribute?.type), MARGIN + 200, y, {
          width: 90,
          lineBreak: false,
          ellipsis: true,
        });
        doc.text(qty, MARGIN + 300, y, { width: 40, lineBreak: false });
        doc.text(formatCurrency(price), MARGIN + 350, y, {
          width: 60,
          lineBreak: false,
        });
        doc
          .font("Helvetica-Bold")
          .text(formatCurrency(total), PAGE_W - MARGIN - 60, y, {
            align: "right",
            width: 50,
            lineBreak: false,
          });

        y += 15;
      });

      y += 5;
      drawRect(doc, MARGIN, y, CONTENT_W, 20, C.accentLight);
      doc
        .fillColor(C.primary)
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("DIRECT MATERIALS TOTAL", MARGIN + 10, y + 5, {
          lineBreak: false,
        });
      doc.text(formatCurrency(directSum), PAGE_W - MARGIN - 80, y + 5, {
        align: "right",
        width: 70,
        lineBreak: false,
      });
      y += 30;
    }

    // 7. THANK YOU PAGE - Only add if there's content or we need a proper closing
    // Check if we're near the end of a page or if the last page has minimal content
    const remainingSpace = doc.page.height - y - BOTTOM_THRESHOLD;

    // If there's very little space left on the current page (< 100 pixels),
    // we'll let the thank you page start on a fresh page
    if (remainingSpace < 100) {
      drawThankYouPage(doc, project);
    } else {
      // Otherwise, draw the thank you content on the current page
      // But first check if we need to add some spacing
      if (y + 200 > doc.page.height - BOTTOM_THRESHOLD) {
        doc.addPage();
      }
      drawThankYouPage(doc, project);
    }
    doc.end();
  });
};
