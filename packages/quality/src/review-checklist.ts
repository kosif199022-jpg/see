export interface ReviewCheck {
  name: string;
  passed: boolean;
}

export const finalReviewChecks: ReviewCheck[] = [
  { name: 'Evidence linked', passed: false },
  { name: 'Finding reviewed', passed: false },
  { name: 'Report sources verified', passed: false }
];
