import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { projects } from "./projects";
import { DemoIndex } from "./DemoIndex";
import { DeclarationNlpDemo } from "./projects/declaration-nlp/DeclarationNlpDemo";
import "./styles.css";

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash || "#/");

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return hash.replace(/^#/, "") || "/";
}

function App() {
  const route = useHashRoute();
  const project = useMemo(
    () => projects.find((item) => route === `/projects/${item.id}`),
    [route],
  );

  if (project?.id === "declaration-nlp") {
    return <DeclarationNlpDemo />;
  }

  return <DemoIndex projects={projects} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
