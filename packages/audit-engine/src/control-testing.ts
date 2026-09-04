export interface ControlTest {
  controlId: string;
  result: 'effective' | 'ineffective' | 'not-tested';
  notes: string[];
}

export function createControlTest(controlId: string): ControlTest {
  return { controlId, result: 'not-tested', notes: [] };
}
