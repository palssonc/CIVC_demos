export type ProjectSummary = {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  audience: string;
  status: "Ready" | "Draft";
};

export const projects: ProjectSummary[] = [
  {
    id: "declaration-nlp",
    title: "Declaration of Independence NLP Clustering",
    shortTitle: "Declaration NLP",
    description:
      "Sort the Declaration's grievances by hand, then compare your categories with groups produced from numerical text representations.",
    audience: "Introductory economics, political economy, government, and U.S. history courses",
    status: "Ready",
  },
];
