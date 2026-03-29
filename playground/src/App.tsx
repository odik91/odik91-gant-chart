import {
  Box,
  Button,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Switch,
  TextField,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import {
  Gantt,
  OnChangeTasks,
  Task,
  TaskOrEmpty,
  ViewMode,
  syncParentDateRangeFromChildren,
} from "@odik91/gantt-task-react";
import { useCallback, useMemo, useRef, useState } from "react";

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
      shortName: "Eko",
      avatarUrl: "https://i.pravatar.cc/64?img=68",
      id: "ProjectSample",
      progress: 25,
      type: "project",
      hideChildren: false,
      /**
       * Parent tidak di-resize manual: jadwal parent mengikuti anak (real-time saat drag + commit).
       * Hilangkan jika proyek harus bisa digeser sendiri.
       */
      isDisabled: true,
    },
    {
      start: new Date(y, m, 1),
      end: new Date(y, m, 3, 12, 0),
      name: "Tugas A — review desain",
      shortName: "Ana",
      avatarUrl: "https://i.pravatar.cc/64?img=12",
      id: "TaskA",
      progress: 45,
      type: "task",
      parent: "ProjectSample",
    },
    {
      start: new Date(y, m, 4),
      end: new Date(y, m, 7),
      name: "Tugas B — implementasi API",
      shortName: "Budi W.",
      avatarUrl: "https://i.pravatar.cc/64?img=33",
      id: "TaskB",
      progress: 10,
      type: "task",
      parent: "ProjectSample",
    },
  ];
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Anak baru di bawah parent: jadwal di dalam rentang parent, `parent` mengikuti id parent */
function createChildTask(parentTask: Task): Task {
  const start = new Date(parentTask.start);
  const end = new Date(parentTask.end);
  const span = Math.max(end.getTime() - start.getTime(), 24 * 60 * 60 * 1000);
  const childEnd = new Date(start.getTime() + Math.min(span, 5 * 24 * 60 * 60 * 1000));
  if (childEnd <= start) {
    childEnd.setTime(start.getTime() + 24 * 60 * 60 * 1000);
  }
  return {
    id: newId("child"),
    name: `Sub-tugas (${parentTask.name})`,
    type: "task",
    parent: parentTask.id,
    start,
    end: childEnd,
    progress: 0,
  };
}

function createRootProject(tasksLength: number): Task {
  const y = new Date().getFullYear();
  const m = new Date().getMonth();
  return {
    id: newId("project"),
    name: `Proyek baru ${tasksLength + 1}`,
    type: "project",
    start: new Date(y, m, 1),
    end: new Date(y, m, 20),
    progress: 0,
    hideChildren: false,
  };
}

function isTaskWithDates(t: TaskOrEmpty): t is Task {
  return t.type !== "empty";
}

function cloneTaskForEdit(t: TaskOrEmpty): TaskOrEmpty {
  if (t.type === "empty") {
    return { ...t };
  }
  return {
    ...t,
    start: new Date(t.start),
    end: new Date(t.end),
  };
}

function formatDateTimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);
  const [showTaskList, setShowTaskList] = useState(true);
  /** State terkontrol: geser/resize batang tugas & progress akan tersimpan */
  const [tasks, setTasks] = useState<TaskOrEmpty[]>(() =>
    syncParentDateRangeFromChildren(buildSampleTasks())
  );
  /**
   * Jika true: Sabtu & Minggu tidak dianggap libur (boleh jadwal tugas),
   * dan tanggal tidak disnap ke hari kerja saat drag/resize.
   */
  const [allowWeekendTasks, setAllowWeekendTasks] = useState(false);
  /** Tombol + di tabel & panel bawah: tambah sub-tugas dengan parent dari hierarki */
  const [enableHierarchyAdd, setEnableHierarchyAdd] = useState(true);
  /** Parent untuk tombol "Tambah sub-tugas" (hierarki task / project) */
  const [selectedParentId, setSelectedParentId] = useState<string>("");

  const editResolverRef = useRef<((value: TaskOrEmpty | null) => void) | null>(
    null
  );
  const [editOpen, setEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<TaskOrEmpty | null>(null);

  const parentCandidates = useMemo(
    () =>
      tasks.filter(
        (t): t is Task => t.type === "task" || t.type === "project"
      ),
    [tasks]
  );

  const selectedParent = useMemo(
    () => parentCandidates.find((t) => t.id === selectedParentId),
    [parentCandidates, selectedParentId]
  );

  const onChangeTasks = useCallback<OnChangeTasks>((nextTasks) => {
    setTasks([...nextTasks]);
  }, []);

  const handleSyncParentDates = useCallback(() => {
    setTasks((prev) => syncParentDateRangeFromChildren(prev));
  }, []);

  const onAddTask = useCallback((parentTask: Task): Promise<TaskOrEmpty | null> => {
    return Promise.resolve(createChildTask(parentTask));
  }, []);

  const onEditTask = useCallback(
    (task: TaskOrEmpty): Promise<TaskOrEmpty | null> => {
      return new Promise((resolve) => {
        setEditDraft(cloneTaskForEdit(task));
        editResolverRef.current = resolve;
        setEditOpen(true);
      });
    },
    []
  );

  const handleEditDialogClose = useCallback((saved: TaskOrEmpty | null) => {
    setEditOpen(false);
    setEditDraft(null);
    const r = editResolverRef.current;
    editResolverRef.current = null;
    if (r) {
      r(saved);
    }
  }, []);

  const handleEditSave = useCallback(() => {
    if (!editDraft) {
      handleEditDialogClose(null);
      return;
    }
    if (isTaskWithDates(editDraft)) {
      let next: Task = { ...editDraft };
      if (next.end < next.start) {
        next = {
          ...next,
          end: new Date(next.start.getTime() + 60 * 60 * 1000),
        };
      }
      next.progress = Math.min(100, Math.max(0, next.progress));
      handleEditDialogClose(next);
      return;
    }
    handleEditDialogClose(editDraft);
  }, [editDraft, handleEditDialogClose]);

  const handleAddChildFromToolbar = useCallback(() => {
    if (!selectedParent) {
      return;
    }
    const child = createChildTask(selectedParent);
    setTasks((prev) => {
      const parentIdx = prev.findIndex((t) => t.id === selectedParent.id);
      const next = [...prev];
      const insertAt = parentIdx >= 0 ? parentIdx + 1 : next.length;
      next.splice(insertAt, 0, child);
      return next;
    });
  }, [selectedParent]);

  const handleAddRootProject = useCallback(() => {
    setTasks((prev) => [...prev, createRootProject(prev.length)]);
  }, []);

  const onViewModeChange = (event: SelectChangeEvent<ViewMode>) => {
    setViewMode(event.target.value as ViewMode);
  };

  const onParentSelectChange = (event: SelectChangeEvent<string>) => {
    setSelectedParentId(event.target.value);
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
          @odik91/gantt-task-react — playground (React 18, sumber dari{" "}
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

          <FormControlLabel
            control={
              <Switch
                checked={allowWeekendTasks}
                onChange={(_, checked) => setAllowWeekendTasks(checked)}
                size="small"
              />
            }
            label="Sabtu & Minggu boleh dipakai (bukan hari libur)"
          />

          <FormControlLabel
            control={
              <Switch
                checked={enableHierarchyAdd}
                onChange={(_, checked) => setEnableHierarchyAdd(checked)}
                size="small"
              />
            }
            label="Tambah sub-tugas (tombol + & panel di bawah)"
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 2,
            p: 1.5,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            bgcolor: "action.hover",
          }}
        >
          <FormControl size="small" sx={{ minWidth: 260 }}>
            <InputLabel id="playground-parent-label">Parent (herarki)</InputLabel>
            <Select<string>
              labelId="playground-parent-label"
              label="Parent (herarki)"
              value={selectedParentId}
              displayEmpty
              onChange={onParentSelectChange}
            >
              <MenuItem value="">
                <em>Pilih task / proyek induk</em>
              </MenuItem>
              {parentCandidates.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.type === "project" ? "[Proyek] " : "[Tugas] "}
                  {t.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            size="small"
            disabled={!selectedParent || !enableHierarchyAdd}
            onClick={handleAddChildFromToolbar}
          >
            Tambah sub-tugas di bawah parent
          </Button>

          <Button
            variant="outlined"
            size="small"
            disabled={!enableHierarchyAdd}
            onClick={handleAddRootProject}
          >
            Tambah proyek (root)
          </Button>
        </Box>

        <p style={{ margin: 0, fontSize: "0.875rem", color: "#555" }}>
          Geser batang untuk pindah jadwal; tarik ujung kiri/kanan untuk ubah
          mulai/selesai; tarik handle progress untuk ubah persentase. Tombol ✎
          membuka edit nama lengkap, nama pendek, URL avatar, tanggal, dan
          progress. Properti <code>shortName</code> dan <code>avatarUrl</code>{" "}
          pada task mengatur label ringkas dan foto. Parent dengan{" "}
          <code>isDisabled: true</code> mengikuti rentang anak langsung; aktifkan{" "}
          <code>isUpdateDisabledParentsOnChange</code> (default). Dengan opsi
          hierarki aktif, gunakan tombol + pada baris untuk menambah anak.
        </p>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
          <Button size="small" variant="outlined" onClick={handleSyncParentDates}>
            Sinkronkan ulang parent dari anak (impor / luar chart)
          </Button>
        </Box>

        <div style={{ flex: 1, minHeight: 0 }}>
          <Gantt
            tasks={tasks}
            viewMode={viewMode}
            columns={showTaskList ? undefined : []}
            onChangeTasks={onChangeTasks}
            isUpdateDisabledParentsOnChange
            isAdjustToWorkingDates={!allowWeekendTasks}
            {...(allowWeekendTasks
              ? {
                  checkIsHoliday: () => false,
                }
              : {})}
            {...(enableHierarchyAdd ? { onAddTask } : {})}
            onEditTask={onEditTask}
          />
        </div>

        <Dialog open={editOpen} onClose={() => handleEditDialogClose(null)} fullWidth maxWidth="sm">
          <DialogTitle>Edit tugas</DialogTitle>
          <DialogContent>
            {editDraft && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
                <TextField
                  label="Nama lengkap"
                  value={editDraft.name}
                  onChange={(e) =>
                    setEditDraft((d) => (d ? { ...d, name: e.target.value } : d))
                  }
                  fullWidth
                  autoFocus
                />
                {isTaskWithDates(editDraft) && (
                  <>
                    <TextField
                      label="Nama PIC (ditampilkan setelah judul, mis. «Judul · PIC»)"
                      value={editDraft.shortName ?? ""}
                      onChange={(e) =>
                        setEditDraft((d) => {
                          if (!d || !isTaskWithDates(d)) {
                            return d;
                          }
                          const v = e.target.value;
                          return {
                            ...d,
                            shortName: v.trim() ? v : undefined,
                          };
                        })
                      }
                      helperText="Kosongkan jika tidak ada PIC; judul baris tetap dari «Nama lengkap»"
                      fullWidth
                    />
                    <TextField
                      label="URL foto avatar"
                      value={editDraft.avatarUrl ?? ""}
                      onChange={(e) =>
                        setEditDraft((d) => {
                          if (!d || !isTaskWithDates(d)) {
                            return d;
                          }
                          const v = e.target.value;
                          return {
                            ...d,
                            avatarUrl: v.trim() ? v : undefined,
                          };
                        })
                      }
                      helperText="Gambar persegi; ditampilkan di daftar & di batang jika cukup lebar"
                      fullWidth
                    />
                    <TextField
                      label="Mulai"
                      type="datetime-local"
                      value={formatDateTimeLocal(editDraft.start)}
                      onChange={(e) =>
                        setEditDraft((d) =>
                          d && isTaskWithDates(d)
                            ? {
                                ...d,
                                start: new Date(e.target.value),
                              }
                            : d
                        )
                      }
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                    <TextField
                      label="Selesai"
                      type="datetime-local"
                      value={formatDateTimeLocal(editDraft.end)}
                      onChange={(e) =>
                        setEditDraft((d) =>
                          d && isTaskWithDates(d)
                            ? {
                                ...d,
                                end: new Date(e.target.value),
                              }
                            : d
                        )
                      }
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                    <TextField
                      label="Progress (%)"
                      type="number"
                      inputProps={{ min: 0, max: 100, step: 1 }}
                      value={editDraft.progress}
                      onChange={(e) => {
                        const v = Math.min(
                          100,
                          Math.max(0, Number(e.target.value) || 0)
                        );
                        setEditDraft((d) =>
                          d && isTaskWithDates(d) ? { ...d, progress: v } : d
                        );
                      }}
                      fullWidth
                    />
                  </>
                )}
                {editDraft.type === "empty" && (
                  <TextField
                    label="Catatan"
                    value="Tugas tanpa tanggal — hanya nama yang bisa diedit"
                    fullWidth
                    disabled
                  />
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => handleEditDialogClose(null)}>Batal</Button>
            <Button variant="contained" onClick={handleEditSave}>
              Simpan
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </ThemeProvider>
  );
}
