// backend/services/pdfService.js
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const pdfDir = path.join(__dirname, '..', 'uploads', 'pdfs');

// Ensure the pdf directory exists
if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir, { recursive: true });
}

/**
 * Create a simple PDF from plain text and save it to outputPath.
 * This version structures the text into paragraphs and handles whitespace cleanly.
 */
function createPdfFromText(text, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 40,
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    doc.font('Times-Roman').fontSize(12);

    const paragraphs = (text || '').split(/\n{2,}/); // split on double line breaks

    paragraphs.forEach((para, index) => {
      const cleaned = para.trim().replace(/\n/g, ' ');
      if (cleaned) {
        doc.text(cleaned, {
          align: 'left',
          paragraphGap: 10,
        });
      }
    });

    doc.end();

    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
}

/**
 * Create a PDF that renders tabular data (rows: array of arrays).
 * Each row is a row in the table. Cells are rendered in columns.
 */
function createPdfFromTable(rows, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const startX = doc.page.margins.left;
    let currentY = doc.page.margins.top;

    const padding = 4;
    const rowHeight = 20;
    const headerFill = '#f3f4f6';

    if (!Array.isArray(rows) || rows.length === 0) {
      doc.text('No table data available.');
      doc.end();
      stream.on('finish', () => resolve(outputPath));
      return;
    }

    const headers = Object.keys(rows[0]);
    const colCount = headers.length;
    const colWidth = pageWidth / colCount;

    function ensureSpaceForRow() {
      if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        currentY = doc.page.margins.top;
      }
    }

    // Draw header row
    ensureSpaceForRow();
    headers.forEach((header, i) => {
      const x = startX + i * colWidth;

      // Fill background
      doc
        .rect(x, currentY, colWidth, rowHeight)
        .fillAndStroke(headerFill, '#000000');

      // Text
      doc
        .fontSize(10)
        .fillColor('#111827')
        .text(header, x + padding, currentY + padding, {
          width: colWidth - 2 * padding,
          height: rowHeight - 2 * padding,
          ellipsis: true,
        });
    });
    currentY += rowHeight;

    // Draw data rows
    rows.forEach((row) => {
      ensureSpaceForRow();
      headers.forEach((header, i) => {
        const x = startX + i * colWidth;
        const text = row[header] !== undefined ? String(row[header]) : '';

        doc
          .rect(x, currentY, colWidth, rowHeight)
          .stroke()
          .fontSize(10)
          .fillColor('#111827')
          .text(text, x + padding, currentY + padding, {
            width: colWidth - 2 * padding,
            height: rowHeight - 2 * padding,
            ellipsis: true,
          });
      });
      currentY += rowHeight;
    });

    doc.end();
    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
}



module.exports = {
  createPdfFromText,
  createPdfFromTable,
  pdfDir,
};
