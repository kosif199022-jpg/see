export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type EngagementRequest = {
  clientName: string;
  period: string;
  framework: 'IFRS' | 'GAAP';
};
