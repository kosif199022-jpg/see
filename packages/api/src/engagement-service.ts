export interface EngagementRequest {
  id: string;
  clientName: string;
  period: string;
  status: 'draft' | 'active' | 'completed';
}

export function createEngagement(input: EngagementRequest): EngagementRequest {
  return {
    ...input,
    status: input.status || 'draft'
  };
}
