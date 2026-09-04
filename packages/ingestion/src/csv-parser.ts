export type RawRow = Record<string,string>;

export function parseCSV(input:string): RawRow[] {
  const lines=input.trim().split(/\r?\n/);
  if(!lines.length) return [];
  const headers=lines[0].split(',').map(h=>h.trim());
  return lines.slice(1).map(line=>{
    const values=line.split(',');
    return headers.reduce((acc,h,i)=>{acc[h]=values[i] ?? ''; return acc;},{} as RawRow);
  });
}
