export interface BatchProgress {
  batch: string;
  completedUnits: number;
  targetUnits: number;
}

export const currentBatch: BatchProgress = {
  batch: '001',
  completedUnits: 0,
  targetUnits: 100
};
