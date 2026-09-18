export type Grievance = {
  id: number;
  short_label: string;
  text: string;
  instructor_theme: string;
  embedding: number[];
  pca: [number, number];
};

export type DeclarationData = {
  metadata: {
    embedding_model: string;
    date_generated: string;
    n_grievances: number;
    dimensions: number;
    note: string;
  };
  grievances: Grievance[];
  cluster_assignments: Record<string, number[]>;
};

export type StudentAssignments = Record<number, number | null>;
export type GroupNames = Record<number, string>;
