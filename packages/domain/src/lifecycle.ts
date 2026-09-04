export type EngagementStatus =
  | 'draft'
  | 'acceptance'
  | 'planning'
  | 'fieldwork'
  | 'review'
  | 'reporting'
  | 'archived'
  | 'on_hold';

export type PbcStatus =
  | 'draft'
  | 'requested'
  | 'received'
  | 'under_review'
  | 'accepted'
  | 'rejected'
  | 'need_clarification'
  | 'overdue';

export type WorkpaperStatus =
  | 'draft'
  | 'prepared'
  | 'reviewer_open'
  | 'cleared'
  | 'approved'
  | 'locked';

export type CouncilStatus =
  | 'prepared'
  | 'running'
  | 'challenged'
  | 'synthesized'
  | 'human_reviewed';

export type AuditActorRole =
  | 'partner'
  | 'manager'
  | 'senior'
  | 'junior'
  | 'quality_reviewer'
  | 'client'
  | 'ai_agent';

export interface TransitionDecision {
  allowed: boolean;
  blockers: string[];
  requiresNewVersion?: boolean;
}

export interface EngagementTransitionInput {
  actorRole: AuditActorRole;
  prerequisites: string[];
  reason?: string;
}

export interface ActorTransitionInput {
  actorRole: AuditActorRole;
}

export interface RiskClosureInput {
  actorRole: AuditActorRole;
  rationale: string;
}

const ENGAGEMENT_NEXT: Record<EngagementStatus, readonly EngagementStatus[]> = {
  draft: ['acceptance', 'on_hold'],
  acceptance: ['planning', 'on_hold'],
  planning: ['fieldwork', 'on_hold'],
  fieldwork: ['review', 'on_hold'],
  review: ['reporting', 'fieldwork', 'on_hold'],
  reporting: ['archived', 'review', 'on_hold'],
  archived: [],
  on_hold: ['acceptance', 'planning', 'fieldwork', 'review', 'reporting'],
};

const PBC_NEXT: Record<PbcStatus, readonly PbcStatus[]> = {
  draft: ['requested'],
  requested: ['received', 'overdue'],
  received: ['under_review'],
  under_review: ['accepted', 'rejected', 'need_clarification'],
  accepted: [],
  rejected: ['requested'],
  need_clarification: ['requested', 'received'],
  overdue: ['received', 'requested'],
};

const WORKPAPER_NEXT: Record<WorkpaperStatus, readonly WorkpaperStatus[]> = {
  draft: ['prepared'],
  prepared: ['reviewer_open'],
  reviewer_open: ['cleared', 'draft'],
  cleared: ['approved', 'reviewer_open'],
  approved: ['locked'],
  locked: [],
};

const COUNCIL_NEXT: Record<CouncilStatus, readonly CouncilStatus[]> = {
  prepared: ['running'],
  running: ['challenged', 'synthesized'],
  challenged: ['synthesized'],
  synthesized: ['human_reviewed'],
  human_reviewed: [],
};

const ARCHIVE_PREREQUISITES = [
  'REPORT_APPROVED',
  'EVIDENCE_SUFFICIENT',
  'OPEN_REVIEW_NOTES_ZERO',
  'OPEN_HIGH_RISKS_ZERO',
] as const;

function deny(...blockers: string[]): TransitionDecision {
  return { allowed: false, blockers };
}

function allow(): TransitionDecision {
  return { allowed: true, blockers: [] };
}

export function validateEngagementTransition(
  from: EngagementStatus,
  to: EngagementStatus,
  input: EngagementTransitionInput,
): TransitionDecision {
  if (!ENGAGEMENT_NEXT[from].includes(to)) {
    return deny('ENGAGEMENT_INVALID_TRANSITION');
  }

  if (from === 'archived') {
    return deny('ARCHIVE_IMMUTABLE');
  }

  if (to === 'archived') {
    const blockers: string[] = [];
    if (input.actorRole !== 'partner') blockers.push('ARCHIVE_PARTNER_REQUIRED');
    for (const prerequisite of ARCHIVE_PREREQUISITES) {
      if (!input.prerequisites.includes(prerequisite)) blockers.push(`MISSING_${prerequisite}`);
    }
    return blockers.length ? { allowed: false, blockers } : allow();
  }

  if (from === 'on_hold' && !input.reason?.trim()) {
    return deny('RESUME_REASON_REQUIRED');
  }

  return allow();
}

export function validatePbcTransition(from: PbcStatus, to: PbcStatus): TransitionDecision {
  return PBC_NEXT[from].includes(to) ? allow() : deny('PBC_INVALID_TRANSITION');
}

export function validateWorkpaperTransition(
  from: WorkpaperStatus,
  to: WorkpaperStatus,
  input: ActorTransitionInput,
): TransitionDecision {
  if ((from === 'approved' || from === 'locked') && to === 'draft') {
    return { allowed: false, blockers: ['WORKPAPER_NEW_VERSION_REQUIRED'], requiresNewVersion: true };
  }

  if (!WORKPAPER_NEXT[from].includes(to)) {
    return deny('WORKPAPER_INVALID_TRANSITION');
  }

  if ((to === 'reviewer_open' || to === 'approved' || to === 'locked') && input.actorRole === 'ai_agent') {
    return deny('HUMAN_REVIEW_REQUIRED');
  }

  if (to === 'approved' && !['partner', 'manager', 'quality_reviewer'].includes(input.actorRole)) {
    return deny('WORKPAPER_APPROVER_REQUIRED');
  }

  if (to === 'locked' && input.actorRole !== 'partner') {
    return deny('WORKPAPER_LOCK_PARTNER_REQUIRED');
  }

  return allow();
}

export function validateCouncilTransition(
  from: CouncilStatus,
  to: CouncilStatus,
  input: ActorTransitionInput,
): TransitionDecision {
  if (!COUNCIL_NEXT[from].includes(to)) {
    return deny('COUNCIL_INVALID_TRANSITION');
  }

  if (to === 'human_reviewed' && input.actorRole === 'ai_agent') {
    return deny('HUMAN_REVIEW_REQUIRED');
  }

  return allow();
}

export function validateRiskClosure(input: RiskClosureInput): TransitionDecision {
  if (!['partner', 'manager', 'quality_reviewer'].includes(input.actorRole)) {
    return deny('RISK_CLOSURE_HUMAN_REQUIRED');
  }
  if (!input.rationale.trim()) {
    return deny('RISK_CLOSURE_RATIONALE_REQUIRED');
  }
  return allow();
}
