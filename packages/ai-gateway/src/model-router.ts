export type AIModel = "openai" | "claude" | "gemini";

export function routeModel(role: string): AIModel {
  if (role === "IFRS Expert") return "claude";
  if (role === "Data Analyst") return "gemini";
  return "openai";
}
