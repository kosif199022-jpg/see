export interface PhaseADemoSeedInput {
  engagementId: string;
  riskId: string;
  evidenceId: string;
  createdAt: string;
  evidenceName?: string;
  evidenceSha256?: string;
  evidenceStatus?: string;
}

export function buildPhaseADemoSeed(input: PhaseADemoSeedInput) {
  const prefix = `${input.engagementId}:demo`;
  const procedureId = `${prefix}:procedure`;
  const workpaperId = `${prefix}:workpaper`;
  const journalEntryId = `${prefix}:journal-entry`;
  const journalRunId = `${prefix}:journal-run`;
  const evidenceSnapshot = [{
    id: input.evidenceId,
    name: input.evidenceName ?? 'demo-evidence.txt',
    sha256: input.evidenceSha256 ?? 'demo-sha256-not-provided',
    status: input.evidenceStatus ?? 'registered',
  }];

  return {
    pbc: {
      id: `${prefix}:pbc`,
      engagementId: input.engagementId,
      title: 'Revenue cut-off support requested',
      description: 'Demo PBC record. Receipt is not evidence acceptance.',
      priority: 'high',
      status: 'received' as const,
      dueAt: null,
      evidenceId: input.evidenceId,
      revision: 1,
      createdBy: 'demo-seed',
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
    },
    procedure: {
      id: procedureId,
      engagementId: input.engagementId,
      riskId: input.riskId,
      title: 'Revenue cut-off substantive procedure',
      objective: 'Inspect selected period-end revenue support and document the reviewer conclusion.',
      procedureType: 'substantive' as const,
      status: 'planned' as const,
      owner: 'demo-senior',
      version: 1,
      createdAt: input.createdAt,
    },
    procedureRun: {
      id: `${prefix}:procedure-run`,
      procedureId,
      engagementId: input.engagementId,
      result: 'Demo execution record only; replace with client-supported test results.',
      conclusion: 'Requires human review before reliance or reporting.',
      status: 'completed' as const,
      performedBy: 'demo-senior',
      performedAt: input.createdAt,
      createdAt: input.createdAt,
    },
    workpaper: {
      id: workpaperId,
      engagementId: input.engagementId,
      procedureId,
      title: 'Revenue cut-off demo workpaper',
      status: 'draft' as const,
      currentVersion: 1,
      createdAt: input.createdAt,
    },
    workpaperVersion: {
      id: `${prefix}:workpaper:v1`,
      workpaperId,
      version: 1,
      content: 'Demo documentation only. No approved audit conclusion is implied.',
      conclusion: 'Draft — requires reviewer resolution of the open note.',
      preparer: 'demo-senior',
      reviewer: null,
      status: 'draft' as const,
      createdAt: input.createdAt,
    },
    reviewNote: {
      id: `${prefix}:review-note`,
      engagementId: input.engagementId,
      workpaperId,
      note: 'Demo open review note: corroborate cut-off evidence before clearing the workpaper.',
      status: 'open' as const,
      createdBy: 'demo-manager',
      clearedBy: null,
      createdAt: input.createdAt,
      clearedAt: null,
    },
    evidenceLink: {
      id: `${prefix}:evidence-link`,
      engagementId: input.engagementId,
      evidenceId: input.evidenceId,
      targetType: 'procedure' as const,
      targetId: procedureId,
      relation: 'supports',
      createdBy: 'demo-seed',
      createdAt: input.createdAt,
    },
    councilRun: {
      id: `${prefix}:council`,
      engagementId: input.engagementId,
      status: 'prepared' as const,
      task: 'Challenge the revenue recognition response using the selected demo evidence metadata.',
      evidenceSnapshotJson: JSON.stringify(evidenceSnapshot),
      synthesisJson: null,
      humanDecision: null,
      humanRationale: null,
      createdBy: 'demo-manager',
      createdAt: input.createdAt,
      reviewedAt: null,
    },
    journalEntry: {
      id: journalEntryId,
      engagementId: input.engagementId,
      sourceVersion: 'SEE-DEMO-JOURNAL-v1',
      entryNumber: 'JE-DEMO-001',
      lineNumber: 1,
      entryDate: '2026-12-31',
      accountCode: '4000',
      accountName: 'الإيرادات',
      debitMinor: 0,
      creditMinor: 12_500_000,
      description: 'Demo manual period-end revenue entry for reviewer training.',
      userName: 'demo-accountant',
      isManual: 1,
      createdAt: input.createdAt,
    },
    journalRun: {
      id: journalRunId,
      engagementId: input.engagementId,
      engineVersion: 'SEE-JOURNAL-v1',
      sourceVersion: 'SEE-DEMO-JOURNAL-v1',
      parametersJson: JSON.stringify({ demo: true, periodEnd: '2026-12-31' }),
      totalEntries: 1,
      flaggedEntries: 1,
      createdBy: 'demo-seed',
      createdAt: input.createdAt,
    },
    journalReviewItem: {
      id: `${prefix}:journal-review-item`,
      engagementId: input.engagementId,
      runId: journalRunId,
      journalEntryId,
      signalCode: 'MANUAL_ENTRY' as const,
      severity: 'attention' as const,
      rationale: 'Demo indicator: a manual journal entry requires reviewer attention; it is not an audit conclusion.',
      status: 'pending' as const,
      createdAt: input.createdAt,
    },
    roundDecisions: [
      { id: `${prefix}:round:A01`, engagementId: input.engagementId, roundCode: 'A01', status: 'complete' as const, rationale: 'Demo acceptance documentation completed by a human reviewer.', actor: 'demo-manager', actorRole: 'manager', version: 1, updatedAt: input.createdAt },
      { id: `${prefix}:round:A02`, engagementId: input.engagementId, roundCode: 'A02', status: 'complete' as const, rationale: 'Demo entity understanding documented for training.', actor: 'demo-manager', actorRole: 'manager', version: 1, updatedAt: input.createdAt },
      { id: `${prefix}:round:A03`, engagementId: input.engagementId, roundCode: 'A03', status: 'attention' as const, rationale: 'Demo round intentionally remains open to demonstrate human gating.', actor: 'demo-manager', actorRole: 'manager', version: 1, updatedAt: input.createdAt },
    ],
    standardUsage: {
      id: `${prefix}:standard-usage`,
      engagementId: input.engagementId,
      standardCode: 'IFRS 18',
      sourceFamily: 'SOCPA 2025 / IFRS',
      sourceVersion: '2027-01-01',
      targetType: 'procedure' as const,
      targetId: procedureId,
      rationale: 'Demo provenance link only; authoritative official text remains required for application.',
      actor: 'demo-manager',
      createdAt: input.createdAt,
    },
    reportVersions: [] as const,
  };
}
