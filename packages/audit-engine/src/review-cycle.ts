export type ReviewRound = {
  id: string;
  name: string;
  status: 'open' | 'review' | 'closed';
  findings: string[];
};

export function createReviewRound(id:string,name:string): ReviewRound {
  return { id, name, status:'open', findings:[] };
}
