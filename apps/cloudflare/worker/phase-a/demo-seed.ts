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
    reportVersions: [] as const,
  };
}
