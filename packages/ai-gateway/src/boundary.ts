export type AIAction =
 | 'suggest'
 | 'analyze'
 | 'approve_opinion'
 | 'lock_archive';

const forbidden: AIAction[] = ['approve_opinion', 'lock_archive'];

export function checkAIBoundary(action: AIAction) {
 return {
  allowed: !forbidden.includes(action),
  reason: forbidden.includes(action)
   ? 'Human approval required'
   : 'Allowed proposal action'
 };
}
