export type StandardReference = {
  id: string;
  framework: 'IFRS' | 'ISA';
  title: string;
  source: string;
};

export function findStandard(refs: StandardReference[], keyword: string) {
  return refs.filter(r => r.title.toLowerCase().includes(keyword.toLowerCase()));
}
