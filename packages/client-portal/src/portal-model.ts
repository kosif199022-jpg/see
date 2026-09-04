export type RequestStatus = 'OPEN' | 'SUBMITTED' | 'REVIEWED' | 'CLOSED';

export interface ClientRequest {
  id: string;
  engagementId: string;
  title: string;
  status: RequestStatus;
  evidenceIds: string[];
}

export function createClientRequest(id: string, engagementId: string, title: string): ClientRequest {
  return {
    id,
    engagementId,
    title,
    status: 'OPEN',
    evidenceIds: []
  };
}
