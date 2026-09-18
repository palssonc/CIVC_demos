import type { DeclarationData, Grievance } from "../types";

const clusterNames = "ABCDEFGH".split("");

export function getClusterAssignments(data: DeclarationData, clusterCount: number) {
  const assignments = data.cluster_assignments[String(clusterCount)] ?? data.cluster_assignments["4"];

  return Object.fromEntries(
    data.grievances.map((grievance, index) => [grievance.id, assignments[index]]),
  ) as Record<number, number>;
}

export function getClusterLabel(clusterId: number) {
  return `Machine Cluster ${clusterNames[clusterId - 1] ?? clusterId}`;
}

export function groupByCluster(grievances: Grievance[], assignments: Record<number, number>) {
  const groups = new Map<number, Grievance[]>();

  grievances.forEach((grievance) => {
    const clusterId = assignments[grievance.id];
    const existing = groups.get(clusterId) ?? [];
    groups.set(clusterId, [...existing, grievance]);
  });

  return [...groups.entries()].sort(([a], [b]) => a - b);
}
