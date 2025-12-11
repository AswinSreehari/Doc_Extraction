// backend/services/tableExtractService.js
const XLSX = require('xlsx');

/**
 * Read a CSV / Excel file and return:
 * - rows: array of arrays (table)
 * - text: flattened string version (for preview / search)
 */
function extractTableAndText(filePath) {
  // Read the workbook (works for .csv, .xls, .xlsx)
  const workbook = XLSX.readFile(filePath);

  // Use the first sheet
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];

  // Convert sheet into array-of-arrays (rows)
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // rows is like:
  // [
  //   ['Name', 'Age', 'City'],
  //   ['John', 30, 'London'],
  //   ...
  // ]

  // Convert to flattened text: columns separated by tabs, rows by newlines
  const text = rows
    .map((row) =>
      row
        .map((cell) =>
          cell === null || cell === undefined ? '' : String(cell)
        )
        .join('\t')
    )
    .join('\n');

  return { rows, text };
}

module.exports = {
  extractTableAndText,
};
