export type ValidationIssue = {
  field: string;
  message: string;
  severity: 'warning' | 'error';
};

export function validateRecord(record: Record<string, unknown>) {
  const issues: ValidationIssue[] = [];
  if (!record) issues.push({field:'record',message:'Missing record',severity:'error'});
  return {valid: issues.length === 0, issues};
}
