/**
 * SocialSentinel — Data Validator
 * Validates social media posts datasets and training datasets.
 */

export const VALID_LABELS = new Set(['positive', 'negative', 'neutral']);

/**
 * Validate a social media posts dataset.
 * Requires the 'text' field.
 * Handles optional fields: id, date, platform.
 *
 * @param {Array<Object>} rows - Raw array of row objects from CSV loader.
 * @returns {{ data: Array<Object>, warnings: string[] }}
 */
export function validatePostsDataset(rows) {
  const warnings = [];

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(
      "The dataset contains no valid entries.\nPlease provide a CSV with social media posts."
    );
  }

  // Check required column
  const firstRow = rows[0];
  if (!('text' in firstRow)) {
    throw new Error(
      "The dataset does not contain the required 'text' column.\n\n" +
      "Expected CSV format:\n\n" +
      "  id,text,date,platform\n" +
      "  1,\"Great service!\",2026-01-01,Twitter"
    );
  }

  const initialCount = rows.length;
  const cleanedData = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const textVal = row.text !== undefined && row.text !== null ? String(row.text).trim() : '';
    if (textVal.length === 0) {
      continue;
    }

    const item = { ...row, text: textVal };

    // Format date if present
    if ('date' in item && item.date) {
      const parsedDate = new Date(item.date);
      if (isNaN(parsedDate.getTime())) {
        item.date = null;
      } else {
        item.date = parsedDate.toISOString().slice(0, 10);
      }
    }

    cleanedData.push(item);
  }

  const dropped = initialCount - cleanedData.length;
  if (dropped > 0) {
    warnings.push(`${dropped} row(s) with empty or missing text were skipped.`);
  }

  if (cleanedData.length === 0) {
    throw new Error(
      "The dataset contains no valid text entries after cleaning.\n" +
      "Please check the 'text' column for empty values."
    );
  }

  // Check optional columns
  const optionalCols = ['id', 'date', 'platform'];
  const presentCols = new Set(Object.keys(firstRow));
  const missingOptional = optionalCols.filter(col => !presentCols.has(col));
  if (missingOptional.length > 0) {
    warnings.push(
      `Optional column(s) not found and will be skipped: ${missingOptional.join(', ')}`
    );
  }

  // Count invalid dates
  if (presentCols.has('date')) {
    const invalidDates = cleanedData.filter(d => !d.date).length;
    if (invalidDates > 0) {
      warnings.push(`${invalidDates} row(s) have invalid or missing dates.`);
    }
  }

  return { data: cleanedData, warnings };
}

/**
 * Validate a training dataset (text + label columns).
 * Normalises labels to lowercase and removes invalid ones.
 *
 * @param {Array<Object>} rows - Raw array of row objects from CSV loader.
 * @returns {{ data: Array<Object>, warnings: string[] }}
 */
export function validateTrainingDataset(rows) {
  const warnings = [];

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("Training dataset is empty.");
  }

  const firstRow = rows[0];
  if (!('text' in firstRow)) {
    throw new Error(
      "Training dataset is missing the 'text' column.\n\n" +
      "Expected format:\n\n  text,label\n  \"Great product\",positive"
    );
  }
  if (!('label' in firstRow)) {
    throw new Error(
      "Training dataset is missing the 'label' column.\n\n" +
      "Expected format:\n\n  text,label\n  \"Great product\",positive"
    );
  }

  const cleanedData = [];
  const invalidFound = new Set();
  let invalidCount = 0;

  for (const row of rows) {
    const rawText = row.text !== undefined && row.text !== null ? String(row.text).trim() : '';
    const rawLabel = row.label !== undefined && row.label !== null ? String(row.label).toLowerCase().trim() : '';

    if (!rawText || !rawLabel) {
      continue;
    }

    if (!VALID_LABELS.has(rawLabel)) {
      invalidCount++;
      invalidFound.add(rawLabel);
      continue;
    }

    cleanedData.push({
      ...row,
      text: rawText,
      label: rawLabel,
    });
  }

  if (invalidCount > 0) {
    warnings.push(
      `${invalidCount} row(s) with unrecognised labels removed (found: ${Array.from(invalidFound).join(', ')}). Valid labels: positive, negative, neutral.`
    );
  }

  if (cleanedData.length < 10) {
    throw new Error(
      `Insufficient training data: only ${cleanedData.length} valid example(s).\n` +
      "At least 10 labelled examples are required."
    );
  }

  // Per-class size counts
  const counts = { positive: 0, negative: 0, neutral: 0 };
  for (const row of cleanedData) {
    counts[row.label] = (counts[row.label] || 0) + 1;
  }

  for (const label of VALID_LABELS) {
    const count = counts[label] || 0;
    if (count < 3) {
      warnings.push(
        `Very few examples for label '${label}': ${count}. Consider adding more training examples for this class.`
      );
    }
  }

  return { data: cleanedData, warnings };
}
