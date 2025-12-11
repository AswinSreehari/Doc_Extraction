// backend/services/textExtractService.js
const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");
const WordExtractor = require("word-extractor");
const extractor = new WordExtractor();
const { extractTableAndText } = require("./tableExtractService");

// ---------- PDF Extractor Fix ----------
let pdfParseImpl = null;
try {
  const pdfParseModule = require("pdf-parse");
  if (typeof pdfParseModule === "function") pdfParseImpl = pdfParseModule;
  else if (pdfParseModule?.default) pdfParseImpl = pdfParseModule.default;
} catch (err) {
  console.warn("⚠ pdf-parse not found or failed to load");
}
const pdfParse = pdfParseImpl;

// ---------- Main Exported Function ----------
async function extractText(filePath, mimeType, originalFileName) {
  const ext = path.extname(originalFileName).toLowerCase();

  if (ext === ".txt") return extractFromTxt(filePath);

  if (ext === ".pdf") return extractFromPdf(filePath);

  if (ext === ".docx") return extractFromDocx(filePath);

  if (ext === ".doc") return extractFromDoc(filePath);

  // --- NEW: CSV / EXCEL SUPPORT ---
  if (ext === ".csv" || ext === ".xlsx" || ext === ".xls") {
    const { rows, text } = extractTableAndText(filePath);
    return {
      extractedText: text,
      tableRows: rows,
      isTable: true,
    };
  }

  // Default fallback: treat as text
  return {
    extractedText: await extractFromTxt(filePath),
    tableRows: null,
    isTable: false,
  };
}

// ---------- Extractors ----------

function extractFromTxt(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) return reject(err);
      resolve({ extractedText: data || "", tableRows: null, isTable: false });
    });
  });
}

function extractFromPdf(filePath) {
  if (!pdfParse) return { extractedText: "", tableRows: null, isTable: false };

  const buffer = fs.readFileSync(filePath);
  return pdfParse(buffer).then((result) => ({
    extractedText: result.text || "",
    tableRows: null,
    isTable: false,
  }));
}

function extractFromDocx(filePath) {
  return mammoth.extractRawText({ path: filePath }).then((result) => ({
    extractedText: result.value || "",
    tableRows: null,
    isTable: false,
  }));
}

async function extractFromDoc(filePath) {
  const doc = await extractor.extract(filePath);
  return {
    extractedText: doc?.getBody() || "",
    tableRows: null,
    isTable: false,
  };
}

module.exports = {
  extractText,
};
