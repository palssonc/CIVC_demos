import { useEffect, useMemo, useState } from "react";
import rawData from "./data/grievances.json";
import type { DeclarationData, Grievance, GroupNames, StudentAssignments } from "./types";
import { getNearestNeighbors } from "./lib/similarity";
import { getClusterAssignments, getClusterLabel, groupByCluster } from "./lib/clustering";
import { alignFourClusters, buildOverlapMatrix, getDisagreements } from "./lib/comparison";

const data = rawData as unknown as DeclarationData;
const storageKey = "declaration-nlp-demo-state";

type DemoState = {
  step: number;
  studentAssignments: StudentAssignments;
  studentGroupNames: GroupNames;
  machineGroupNames: GroupNames;
  clusterCount: number;
  selectedSimilarityId: number;
  pinnedScatterId: number | null;
  finalReflection: string;
};

const steps = [
  "Start",
  "Human Grouping",
  "Name Groups",
  "Embeddings",
  "Similarity",
  "PCA Map",
  "Reveal Clusters",
  "Clustering",
  "Machine Groups",
  "Compare",
  "Reflect",
];

function createInitialState(): DemoState {
  return {
    step: 0,
    studentAssignments: Object.fromEntries(data.grievances.map((grievance) => [grievance.id, null])),
    studentGroupNames: { 1: "", 2: "", 3: "", 4: "" },
    machineGroupNames: { 1: "", 2: "", 3: "", 4: "" },
    clusterCount: 4,
    selectedSimilarityId: 17,
    pinnedScatterId: null,
    finalReflection: "",
  };
}

export function DeclarationNlpDemo() {
  const [state, setState] = useState<DemoState>(() => {
    const saved = window.localStorage.getItem(storageKey);
    return saved ? { ...createInitialState(), ...JSON.parse(saved) } : createInitialState();
  });

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  const machineAssignments = useMemo(
    () => getClusterAssignments(data, state.clusterCount),
    [state.clusterCount],
  );
  const allAssigned = data.grievances.every((grievance) => state.studentAssignments[grievance.id]);

  function updateState(patch: Partial<DemoState>) {
    setState((current) => ({ ...current, ...patch }));
  }

  function goToStep(step: number) {
    updateState({ step: Math.max(0, Math.min(steps.length - 1, step)) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetActivity() {
    const next = createInitialState();
    setState(next);
    window.localStorage.removeItem(storageKey);
  }

  return (
    <main className="demo-shell">
      <header className="demo-header">
        <a href="#/" className="back-link">
          Back to demos
        </a>
        <div>
          <p className="eyebrow">Declaration NLP activity</p>
          <h1>Can a computer find the main themes of the Declaration?</h1>
        </div>
        <button className="ghost-button" type="button" onClick={resetActivity}>
          Reset
        </button>
      </header>

      <nav className="stepper" aria-label="Activity steps">
        {steps.map((label, index) => (
          <button
            className={index === state.step ? "active" : ""}
            key={label}
            type="button"
            onClick={() => goToStep(index)}
          >
            <span>{index + 1}</span>
            {label}
          </button>
        ))}
      </nav>

      {state.step === 0 && <Landing onStart={() => goToStep(1)} />}
      {state.step === 1 && (
        <HumanGrouping
          assignments={state.studentAssignments}
          grievances={data.grievances}
          onAssign={(id, group) =>
            updateState({
              studentAssignments: { ...state.studentAssignments, [id]: group },
            })
          }
          allAssigned={allAssigned}
        />
      )}
      {state.step === 2 && (
        <NameGroups
          groupNames={state.studentGroupNames}
          assignments={state.studentAssignments}
          grievances={data.grievances}
          onChange={(group, value) =>
            updateState({ studentGroupNames: { ...state.studentGroupNames, [group]: value } })
          }
        />
      )}
      {state.step === 3 && <EmbeddingsLesson />}
      {state.step === 4 && (
        <SimilarityExplorer
          grievances={data.grievances}
          selectedId={state.selectedSimilarityId}
          onSelect={(selectedSimilarityId) => updateState({ selectedSimilarityId })}
        />
      )}
      {state.step === 5 && (
        <PcaMap
          grievances={data.grievances}
          assignments={machineAssignments}
          selectedId={state.pinnedScatterId}
          onSelect={(pinnedScatterId) => updateState({ pinnedScatterId })}
          mode="neutral"
        />
      )}
      {state.step === 6 && (
        <PcaMap
          grievances={data.grievances}
          assignments={machineAssignments}
          selectedId={state.pinnedScatterId}
          onSelect={(pinnedScatterId) => updateState({ pinnedScatterId })}
          mode="colored"
        />
      )}
      {state.step === 7 && (
        <ClusteringScreen
          grievances={data.grievances}
          assignments={machineAssignments}
          clusterCount={state.clusterCount}
          onClusterCountChange={(clusterCount) => updateState({ clusterCount })}
        />
      )}
      {state.step === 8 && (
        <MachineGroups
          grievances={data.grievances}
          assignments={getClusterAssignments(data, 4)}
          machineGroupNames={state.machineGroupNames}
          onChange={(group, value) =>
            updateState({ machineGroupNames: { ...state.machineGroupNames, [group]: value } })
          }
        />
      )}
      {state.step === 9 && (
        <CompareScreen
          grievances={data.grievances}
          studentAssignments={state.studentAssignments}
          studentGroupNames={state.studentGroupNames}
          machineAssignments={getClusterAssignments(data, 4)}
        />
      )}
      {state.step === 10 && (
        <FinalReflection
          value={state.finalReflection}
          onChange={(finalReflection) => updateState({ finalReflection })}
        />
      )}

      <footer className="demo-footer">
        <button type="button" className="secondary-button" onClick={() => goToStep(state.step - 1)}>
          Previous
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={() => goToStep(state.step + 1)}
          disabled={state.step === steps.length - 1}
        >
          Next
        </button>
      </footer>
    </main>
  );
}

function Landing({ onStart }: { onStart: () => void }) {
  return (
    <section className="lesson-panel intro-panel">
      <div>
        <p className="eyebrow">Text {"->"} numbers {"->"} similarity {"->"} clustering {"->"} interpretation</p>
        <h2>Start by thinking like a historian. Then compare that with a machine grouping.</h2>
        <p>
          The Declaration contains 27 grievances against King George III. In this activity, you will
          first create your own grouping. Then you will see how numerical representations of language
          can be used to find groups without being handed theme labels.
        </p>
      </div>
      <button className="primary-button large" type="button" onClick={onStart}>
        Start the Activity
      </button>
    </section>
  );
}

function HumanGrouping({
  grievances,
  assignments,
  onAssign,
  allAssigned,
}: {
  grievances: Grievance[];
  assignments: StudentAssignments;
  onAssign: (id: number, group: number | null) => void;
  allAssigned: boolean;
}) {
  const unassigned = grievances.filter((grievance) => !assignments[grievance.id]);

  return (
    <section className="lesson-panel">
      <div className="section-heading">
        <div>
          <h2>Sort the grievances into four groups</h2>
          <p>
            Use your own sense of meaning. The groups can be uneven, and you can move a grievance
            whenever you change your mind.
          </p>
        </div>
        <span className={allAssigned ? "completion done" : "completion"}>
          {27 - unassigned.length}/27 assigned
        </span>
      </div>

      <div className="grouping-layout">
        <div className="card-stack">
          <h3>Unassigned</h3>
          {unassigned.length === 0 ? (
            <p className="empty-note">Every grievance has a group.</p>
          ) : (
            unassigned.map((grievance) => (
              <GrievanceCard
                grievance={grievance}
                key={grievance.id}
                controls={[1, 2, 3, 4].map((group) => ({
                  label: `Group ${group}`,
                  onClick: () => onAssign(grievance.id, group),
                }))}
              />
            ))
          )}
        </div>

        <div className="student-groups">
          {[1, 2, 3, 4].map((group) => (
            <div className="group-column" key={group}>
              <h3>Group {group}</h3>
              {grievances
                .filter((grievance) => assignments[grievance.id] === group)
                .map((grievance) => (
                  <GrievanceCard
                    grievance={grievance}
                    compact
                    key={grievance.id}
                    controls={[
                      { label: "Remove", onClick: () => onAssign(grievance.id, null) },
                      ...[1, 2, 3, 4]
                        .filter((candidate) => candidate !== group)
                        .map((candidate) => ({
                          label: `Move to ${candidate}`,
                          onClick: () => onAssign(grievance.id, candidate),
                        })),
                    ]}
                  />
                ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function NameGroups({
  grievances,
  assignments,
  groupNames,
  onChange,
}: {
  grievances: Grievance[];
  assignments: StudentAssignments;
  groupNames: GroupNames;
  onChange: (group: number, value: string) => void;
}) {
  return (
    <section className="lesson-panel">
      <h2>Name your four groups</h2>
      <p>What do the grievances in each group have in common?</p>
      <div className="name-grid">
        {[1, 2, 3, 4].map((group) => (
          <label className="name-card" key={group}>
            <span>Group {group} name</span>
            <input
              value={groupNames[group] ?? ""}
              onChange={(event) => onChange(group, event.target.value)}
              placeholder="Short phrase"
            />
            <small>
              {grievances.filter((grievance) => assignments[grievance.id] === group).length}{" "}
              grievances
            </small>
          </label>
        ))}
      </div>
      <div className="callout">
        You just performed a classification task using your understanding of meaning. How could a
        computer do something similar?
      </div>
    </section>
  );
}

function EmbeddingsLesson() {
  return (
    <section className="lesson-panel split-panel">
      <div>
        <h2>Turn language into numbers</h2>
        <p>
          A language model can represent each sentence as a long list of numbers called an
          embedding. Sentences with similar meanings tend to have embeddings that are closer
          together.
        </p>
        <p>
          The embedding model creates the representation. The clustering algorithm uses those
          representations. During clustering, the app is comparing numbers, not reading the sentence
          like a person.
        </p>
      </div>
      <div className="vector-demo">
        <strong>Taxes without consent</strong>
        <p>For imposing Taxes on us without our Consent.</p>
        <code>[0.42, 0.06, 0.84, 0.03, 0.22, 0.03, ...]</code>
      </div>
    </section>
  );
}

function SimilarityExplorer({
  grievances,
  selectedId,
  onSelect,
}: {
  grievances: Grievance[];
  selectedId: number;
  onSelect: (id: number) => void;
}) {
  const selected = grievances.find((grievance) => grievance.id === selectedId) ?? grievances[0];
  const neighbors = getNearestNeighbors(grievances, selected.id);

  return (
    <section className="lesson-panel">
      <h2>Explore similarity</h2>
      <p>
        Once sentences are represented numerically, we can compare two embeddings. A high cosine
        similarity means the vectors point in similar directions.
      </p>
      <div className="similarity-layout">
        <div className="selector-list">
          {grievances.map((grievance) => (
            <button
              className={grievance.id === selected.id ? "selected" : ""}
              key={grievance.id}
              type="button"
              onClick={() => onSelect(grievance.id)}
            >
              {grievance.id}. {grievance.short_label}
            </button>
          ))}
        </div>
        <div className="neighbor-panel">
          <h3>Selected grievance</h3>
          <blockquote>{selected.text}</blockquote>
          <h3>Most similar grievances</h3>
          <ol className="neighbor-list">
            {neighbors.map(({ grievance, score }) => (
              <li key={grievance.id}>
                <span>{grievance.short_label}</span>
                <strong>{score.toFixed(2)}</strong>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function PcaMap({
  grievances,
  assignments,
  selectedId,
  onSelect,
  mode,
}: {
  grievances: Grievance[];
  assignments: Record<number, number>;
  selectedId: number | null;
  onSelect: (id: number) => void;
  mode: "neutral" | "colored";
}) {
  const selected = grievances.find((grievance) => grievance.id === selectedId);
  const isNeutral = mode === "neutral";

  return (
    <section className="lesson-panel">
      <h2>{isNeutral ? "Look for patterns before the colors" : "Reveal the machine clusters"}</h2>
      {isNeutral ? (
        <p>
          This is the same PCA map without cluster colors. Before seeing the algorithm's grouping,
          look for points that seem close together and decide what groups you expect to appear.
        </p>
      ) : (
        <p>
          Now the same points are colored by the current machine clustering. The picture still uses
          PCA only for display; the clustering is based on the original embeddings.
        </p>
      )}
      <div className="scatter-layout">
        <div className="scatterplot" role="img" aria-label="PCA scatterplot of 27 grievances">
          {grievances.map((grievance) => (
            <button
              className={`point ${isNeutral ? "neutral-point" : `cluster-${assignments[grievance.id]}`} ${
                selectedId === grievance.id ? "pinned" : ""
              }`}
              key={grievance.id}
              style={{
                left: `${normalize(grievance.pca[0], -2.5, 2.3)}%`,
                bottom: `${normalize(grievance.pca[1], -2, 2.3)}%`,
              }}
              type="button"
              title={grievance.text}
              onClick={() => onSelect(grievance.id)}
            >
              {grievance.id}
            </button>
          ))}
          <span className="axis x-axis">PCA Dimension 1</span>
          <span className="axis y-axis">PCA Dimension 2</span>
        </div>
        <div className="detail-card">
          <h3>{selected ? selected.short_label : "Click a point"}</h3>
          <p>{selected ? selected.text : "Select a grievance to inspect its full text."}</p>
          {isNeutral && (
            <div className="callout compact-callout">
              Which points would you group together before the algorithm shows its colors?
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ClusteringScreen({
  grievances,
  assignments,
  clusterCount,
  onClusterCountChange,
}: {
  grievances: Grievance[];
  assignments: Record<number, number>;
  clusterCount: number;
  onClusterCountChange: (value: number) => void;
}) {
  const groups = groupByCluster(grievances, assignments);

  return (
    <section className="lesson-panel">
      <div className="section-heading">
        <div>
          <h2>Hierarchical clustering</h2>
          <p>
            The algorithm creates a hierarchy. We choose where to cut that hierarchy, which means the
            number of groups is a modeling decision.
          </p>
        </div>
        <label className="slider-control">
          <span>Number of groups: {clusterCount}</span>
          <input
            type="range"
            min="2"
            max="8"
            value={clusterCount}
            onChange={(event) => onClusterCountChange(Number(event.target.value))}
          />
        </label>
      </div>
      <div className="machine-grid">
        {groups.map(([clusterId, items]) => (
          <div className="machine-card" key={clusterId}>
            <h3>{getClusterLabel(clusterId)}</h3>
            <ul>
              {items.map((grievance) => (
                <li key={grievance.id}>{grievance.short_label}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function MachineGroups({
  grievances,
  assignments,
  machineGroupNames,
  onChange,
}: {
  grievances: Grievance[];
  assignments: Record<number, number>;
  machineGroupNames: GroupNames;
  onChange: (group: number, value: string) => void;
}) {
  return (
    <section className="lesson-panel">
      <h2>Interpret the four machine groups</h2>
      <p>
        The algorithm produced groups, but it did not name them. Looking at each machine cluster,
        what would you call it?
      </p>
      <div className="machine-grid">
        {groupByCluster(grievances, assignments).map(([clusterId, items]) => (
          <div className="machine-card" key={clusterId}>
            <h3>{getClusterLabel(clusterId)}</h3>
            <input
              value={machineGroupNames[clusterId] ?? ""}
              placeholder="Your interpretation"
              onChange={(event) => onChange(clusterId, event.target.value)}
            />
            <ul>
              {items.map((grievance) => (
                <li key={grievance.id}>{grievance.short_label}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function CompareScreen({
  grievances,
  studentAssignments,
  studentGroupNames,
  machineAssignments,
}: {
  grievances: Grievance[];
  studentAssignments: StudentAssignments;
  studentGroupNames: GroupNames;
  machineAssignments: Record<number, number>;
}) {
  const overlap = buildOverlapMatrix(grievances, studentAssignments, machineAssignments);
  const alignment = alignFourClusters(overlap);
  const disagreements = getDisagreements(grievances, studentAssignments, machineAssignments, alignment);

  return (
    <section className="lesson-panel">
      <h2>Compare human and machine grouping</h2>
      <p>
        Machine cluster labels are arbitrary, so the app first aligns them to your groups in the way
        that maximizes overlap.
      </p>
      <div className="comparison-layout">
        <table className="overlap-table">
          <thead>
            <tr>
              <th>Student group</th>
              {[1, 2, 3, 4].map((cluster) => (
                <th key={cluster}>Cluster {String.fromCharCode(64 + cluster)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {overlap.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <th>{studentGroupNames[rowIndex + 1] || `Group ${rowIndex + 1}`}</th>
                {row.map((value, columnIndex) => (
                  <td className={alignment[rowIndex] === columnIndex ? "matched" : ""} key={columnIndex}>
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="disagreement-panel">
          <h3>Places to discuss</h3>
          {disagreements.length === 0 ? (
            <p>Your grouping and the aligned machine grouping agree on every grievance.</p>
          ) : (
            <ul>
              {disagreements.slice(0, 8).map((grievance) => (
                <li key={grievance.id}>{grievance.short_label}</li>
              ))}
            </ul>
          )}
          <p>
            Why might the computer have placed one of these somewhere different from you? The wording,
            mixed themes, and your category boundaries all matter.
          </p>
        </div>
      </div>
    </section>
  );
}

function FinalReflection({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <section className="lesson-panel">
      <h2>Final reflection</h2>
      <div className="lesson-grid">
        <div>
          <h3>Text can be represented numerically</h3>
          <p>Embeddings turn language into vectors while preserving useful information about meaning.</p>
        </div>
        <div>
          <h3>Similarity can create groups</h3>
          <p>Once text is numerical, mathematical tools can compare sentences and find clusters.</p>
        </div>
        <div>
          <h3>Categories still require judgment</h3>
          <p>
            Researchers choose the representation, similarity measure, clustering method, number of
            groups, and interpretation.
          </p>
        </div>
      </div>
      <label className="reflection-box">
        <span>Did the computer discover themes, or did we build a system that made patterns visible?</span>
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={5} />
      </label>
    </section>
  );
}

function GrievanceCard({
  grievance,
  controls,
  compact = false,
}: {
  grievance: Grievance;
  controls: { label: string; onClick: () => void }[];
  compact?: boolean;
}) {
  return (
    <article className={compact ? "grievance-card compact" : "grievance-card"}>
      <strong>
        {grievance.id}. {grievance.short_label}
      </strong>
      <p>{grievance.text}</p>
      <div className="card-actions">
        {controls.map((control) => (
          <button key={control.label} type="button" onClick={control.onClick}>
            {control.label}
          </button>
        ))}
      </div>
    </article>
  );
}

function normalize(value: number, min: number, max: number) {
  return ((value - min) / (max - min)) * 84 + 8;
}
