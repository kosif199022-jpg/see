export type Role = 'partner' | 'manager' | 'auditor' | 'client';

export function canAccess(role: Role, action: string): boolean {
  if (role === 'partner') return true;
  if (action === 'view') return true;
  return role !== 'client';
}
