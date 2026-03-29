import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { Gantt, Task, ViewMode } from "@wamra/gantt-task-react";
import { useMemo, useState } from "react";

const theme = createTheme();

function buildSampleTasks(): Task[] {
  const y = new Date().getFullYear();
  const m = new Date().getMonth();
  return [
    {
      start: new Date(y, m, 2),
      end: new Date(y, m, 8),
      name: "Contoh proyek",
      id: "ProjectSample",
      progress: 25,
      type: "project",
      hideChildren: false,
    },
    {
      start: new Date(y, m, 1),
      end: new Date(y, m, 3, 12, 0),
      name: "Tugas A",
      id: "TaskA",
      progress: 45,
      type: "task",
      parent: "ProjectSample",
    },
    {
      start: new Date(y, m, 4),
      end: new Date(y, m, 7),
      name: "Tugas B",
      id: "TaskB",
      progress: 10,
      type: "task",
      parent: "ProjectSample",
    },
  ];
}

export default function App() {
  const [viewMode] = useState(ViewMode.Month);
  const tasks = useMemo(() => buildSampleTasks(), []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div
        style={{
          padding: 16,
          height: "100vh",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h1 style={{ margin: "0 0 12px", fontSize: "1.25rem" }}>
          @wamra/gantt-task-react — playground (React 18, sumber dari{" "}
          <code>src/</code>)
        </h1>
        <div style={{ flex: 1, minHeight: 0 }}>
          <Gantt tasks={tasks} viewMode={viewMode} />
        </div>
      </div>
    </ThemeProvider>
  );
}
