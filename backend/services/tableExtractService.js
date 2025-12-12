const XLSX = require('xlsx');

/**
 * Read a CSV / Excel file and return:
 * - rows: array of structured objects
 * - text: flattened string version (for preview / search)
 */
function extractTableAndText(filePath) {
  // Read the workbook (works for .csv, .xls, .xlsx)
  const workbook = XLSX.readFile(filePath);

  // Use the first sheet
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];

  // Convert sheet to array-of-arrays for raw rows
  const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Extract headers from first row
  const headers = rawRows[0] || [];

  // Transform to array of structured objects
  const rows = rawRows.slice(1).map((row) => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header !== undefined ? String(header).trim() : `Column ${index}`] = row[index] !== undefined ? String(row[index]) : '';
    });
    return obj;
  });

  // Convert to flattened text: columns separated by tabs, rows by newlines
  const text = rawRows
    .map((row) =>
      row
        .map((cell) =>
          cell === null || cell === undefined ? '' : String(cell)
        )
        .join('\t')
    )
    .join('\n');

  return { headers, rows, text };
}

module.exports = {
  extractTableAndText,
};
