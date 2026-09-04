export type SpreadsheetRow = Record<string, string | number | null>;

export function parseWorkbook(rows: SpreadsheetRow[]) {
  return rows.map((row, index) => ({
    rowId: index + 1,
    values: row,
    status: 'pending_validation'
  }));
}
