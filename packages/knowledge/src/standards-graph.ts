export interface StandardNode {
 id: string;
 standard: string;
 topic: string;
 relatedAccounts: string[];
 procedures: string[];
}

export function createStandardNode(
 standard: string,
 topic: string
): StandardNode {
 return {
  id: `${standard}-${topic}`,
  standard,
  topic,
  relatedAccounts: [],
  procedures: []
 };
}
