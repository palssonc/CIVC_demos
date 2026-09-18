import type { Grievance } from "../types";

export function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0;
  let aNorm = 0;
  let bNorm = 0;

  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    aNorm += a[index] * a[index];
    bNorm += b[index] * b[index];
  }

  if (aNorm === 0 || bNorm === 0) {
    return 0;
  }

  return dot / (Math.sqrt(aNorm) * Math.sqrt(bNorm));
}

export function getNearestNeighbors(grievances: Grievance[], selectedId: number, count = 5) {
  const selected = grievances.find((grievance) => grievance.id === selectedId);

  if (!selected) {
    return [];
  }

  return grievances
    .filter((grievance) => grievance.id !== selectedId)
    .map((grievance) => ({
      grievance,
      score: cosineSimilarity(selected.embedding, grievance.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

export function buildSimilarityMatrix(grievances: Grievance[]) {
  return grievances.map((row) =>
    grievances.map((column) => cosineSimilarity(row.embedding, column.embedding)),
  );
}
