/**
 * SocialSentinel — Data Loader
 * Handles loading CSV files with clear, user-friendly error messages.
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Robust RFC 4180 compliant CSV parser.
 * Handles quoted fields, embedded newlines, and escaped quotes.
 *
 * @param {string} text - Raw CSV content.
 * @returns {Array<Object<string, string>>} Array of row objects.
 */
export function parseCsvString(text) {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  // Filter out any trailing completely empty lines
  const cleanRows = rows.filter(r => r.some(cell => cell.trim().length > 0));

  if (cleanRows.length === 0) {
    return [];
  }

  const headers = cleanRows[0].map(h => h.trim());
  const dataRows = cleanRows.slice(1);

  const result = [];
  for (const row of dataRows) {
    const obj = {};
    for (let h = 0; h < headers.length; h++) {
      const key = headers[h];
      obj[key] = row[h] !== undefined ? row[h].trim() : '';
    }
    result.push(obj);
  }

  return result;
}

/**
 * Load a CSV file and return an array of record objects.
 *
 * @param {string} filepath - Path to the CSV file.
 * @returns {Array<Object<string, string>>} Array of row objects.
 * @throws {Error} If the file does not exist, is not a CSV, or is empty.
 */
export function loadCsv(filepath) {
  const resolvedPath = path.resolve(filepath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(
      `File not found: '${filepath}'\n\nPlease check the path and try again.`
    );
  }

  if (path.extname(resolvedPath).toLowerCase() !== '.csv') {
    throw new Error(
      `Expected a .csv file, got '${path.extname(resolvedPath)}'.\n\nSocialSentinel only accepts CSV files.`
    );
  }

  let rawContent;
  try {
    rawContent = fs.readFileSync(resolvedPath, 'utf8');
  } catch (err) {
    try {
      rawContent = fs.readFileSync(resolvedPath, 'latin1');
    } catch (fallbackErr) {
      throw new Error(
        `Cannot read file '${filepath}' — encoding error.\nDetails: ${fallbackErr.message}`
      );
    }
  }

  if (!rawContent || rawContent.trim().length === 0) {
    throw new Error(`The CSV file is empty: '${filepath}'`);
  }

  let data;
  try {
    data = parseCsvString(rawContent);
  } catch (parseErr) {
    throw new Error(
      `Failed to parse CSV file '${filepath}'.\nParser error: ${parseErr.message}`
    );
  }

  if (data.length === 0) {
    throw new Error(
      `The dataset is empty: '${filepath}'\n\nThe file was read successfully but contains no rows.`
    );
  }

  return data;
}
