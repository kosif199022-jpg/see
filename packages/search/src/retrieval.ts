export type SearchRecord = {
  id: string;
  type: string;
  text: string;
  sourceId: string;
  version: string;
};

export function search(records: SearchRecord[], query: string) {
  const q = query.toLowerCase();
  return records.filter(r => r.text.toLowerCase().includes(q));
}
