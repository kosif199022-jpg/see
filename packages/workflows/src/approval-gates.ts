export type ApprovalGate = {
  id: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  approver?: string;
};

export function approveGate(gate: ApprovalGate, approver: string) {
  return { ...gate, status: 'approved', approver };
}
