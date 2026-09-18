import type { Grievance, StudentAssignments } from "../types";

export function buildOverlapMatrix(
  grievances: Grievance[],
  studentAssignments: StudentAssignments,
  machineAssignments: Record<number, number>,
) {
  const matrix = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => 0));

  grievances.forEach((grievance) => {
    const studentGroup = studentAssignments[grievance.id];
    const machineGroup = machineAssignments[grievance.id];

    if (studentGroup && machineGroup >= 1 && machineGroup <= 4) {
      matrix[studentGroup - 1][machineGroup - 1] += 1;
    }
  });

  return matrix;
}

export function alignFourClusters(overlapMatrix: number[][]) {
  const permutations = permute([0, 1, 2, 3]);
  let best = permutations[0];
  let bestScore = -1;

  permutations.forEach((candidate) => {
    const score = candidate.reduce(
      (total, machineColumn, studentRow) => total + overlapMatrix[studentRow][machineColumn],
      0,
    );

    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  });

  return best;
}

export function getDisagreements(
  grievances: Grievance[],
  studentAssignments: StudentAssignments,
  machineAssignments: Record<number, number>,
  alignment: number[],
) {
  const machineToStudent = new Map<number, number>();
  alignment.forEach((machineColumn, studentRow) => {
    machineToStudent.set(machineColumn + 1, studentRow + 1);
  });

  return grievances.filter((grievance) => {
    const studentGroup = studentAssignments[grievance.id];
    const alignedStudentGroup = machineToStudent.get(machineAssignments[grievance.id]);
    return studentGroup !== alignedStudentGroup;
  });
}

function permute(values: number[]): number[][] {
  if (values.length <= 1) {
    return [values];
  }

  return values.flatMap((value, index) =>
    permute(values.filter((_, candidateIndex) => candidateIndex !== index)).map((rest) => [
      value,
      ...rest,
    ]),
  );
}
