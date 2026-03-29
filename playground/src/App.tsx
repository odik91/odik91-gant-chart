import {
  Box,
  CssBaseline,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Switch,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import { Gantt, Task, ViewMode } from "@wamra/gantt-task-react";
import { useMemo, useState } from "react";

const theme = createTheme();

/** Semua nilai ViewMode untuk dropdown skala timeline */
const VIEW_MODE_OPTIONS: { mode: ViewMode; label: string }[] = [
  { mode: ViewMode.Hour, label: "Jam (Hour)" },
  { mode: ViewMode.QuarterDay, label: "Seperempat hari (Quarter day)" },
  { mode: ViewMode.HalfDay, label: "Setengah hari (Half day)" },
  { mode: ViewMode.Day, label: "Hari (Day)" },
  { mode: ViewMode.TwoDays, label: "Dua hari (Two days)" },
  { mode: ViewMode.Week, label: "Minggu / ISO week (Week)" },
  { mode: ViewMode.Month, label: "Bulan (Month)" },
  { mode: ViewMode.QuarterYear, label: "Kuartal (Quarter year)" },
  { mode: ViewMode.Year, label: "Tahun (Year)" },
];

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
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);
  const [showTaskList, setShowTaskList] = useState(true);
  const tasks = useMemo(() => buildSampleTasks(), []);

  const onViewModeChange = (event: SelectChangeEvent<ViewMode>) => {
    setViewMode(event.target.value as ViewMode);
  };

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
          gap: 12,
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.25rem" }}>
          @wamra/gantt-task-react — playground (React 18, sumber dari{" "}
          <code>src/</code>)
        </h1>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 2,
          }}
        >
          <FormControl size="small" sx={{ minWidth: 280 }}>
            <InputLabel id="playground-view-mode-label">Skala waktu</InputLabel>
            <Select<ViewMode>
              labelId="playground-view-mode-label"
              label="Skala waktu"
              value={viewMode}
              onChange={onViewModeChange}
            >
              {VIEW_MODE_OPTIONS.map(({ mode, label }) => (
                <MenuItem key={mode} value={mode}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={showTaskList}
                onChange={(_, checked) => setShowTaskList(checked)}
                size="small"
              />
            }
            label="Tampilkan daftar tugas (kiri)"
          />
        </Box>

        <div style={{ flex: 1, minHeight: 0 }}>
          <Gantt
            tasks={tasks}
            viewMode={viewMode}
            columns={showTaskList ? undefined : []}
          />
        </div>
      </div>
    </ThemeProvider>
  );
}
