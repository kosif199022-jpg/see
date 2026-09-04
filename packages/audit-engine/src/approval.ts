export interface ApprovalGate {
  id: string;
  subject: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
}

export function approve(gate: ApprovalGate, user: string) {
  return { ...gate, status: 'approved' as const, approvedBy: user };
}
