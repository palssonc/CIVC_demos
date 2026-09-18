import type { ProjectSummary } from "./projects";

type DemoIndexProps = {
  projects: ProjectSummary[];
};

export function DemoIndex({ projects }: DemoIndexProps) {
  return (
    <main className="site-shell">
      <section className="index-hero">
        <p className="eyebrow">CIVC classroom demos</p>
        <h1>Interactive lessons for civic and data literacy</h1>
        <p>
          A growing collection of classroom-ready activities for teaching core ideas through direct,
          hands-on exploration.
        </p>
      </section>

      <section className="project-grid" aria-label="Available demos">
        {projects.map((project) => (
          <a className="project-card" href={`#/projects/${project.id}`} key={project.id}>
            <span className="status">{project.status}</span>
            <h2>{project.title}</h2>
            <p>{project.description}</p>
            <small>{project.audience}</small>
          </a>
        ))}
      </section>
    </main>
  );
}
