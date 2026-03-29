import type { Task, TaskOrEmpty } from "../types/public-types";

/**
 * Menyetel `start` / `end` setiap task yang punya anak ke rentang minimum–maksimum
 * tanggal **anak langsung** (sama logika dengan `getSuggestedStartEndChangesFromDirectChildren`).
 * Berguna untuk data awal impor atau setelah mengubah anak di luar chart.
 *
 * Urutan pembaruan: parent terdalam dulu, agar induk memuat rentang sub-proyek yang sudah diselaraskan.
 */
export function syncParentDateRangeFromChildren(
  tasks: readonly TaskOrEmpty[]
): TaskOrEmpty[] {
  const list: TaskOrEmpty[] = tasks.map((t) =>
    t.type === "empty"
      ? { ...t }
      : {
          ...t,
          start: new Date((t as Task).start),
          end: new Date((t as Task).end),
        }
  );

  const idToIndex = new Map(list.map((t, i) => [t.id, i]));
  const getTask = (id: string): TaskOrEmpty | undefined => {
    const i = idToIndex.get(id);
    if (i === undefined) {
      return undefined;
    }
    return list[i];
  };

  const depthOf = (id: string): number => {
    const t = getTask(id);
    if (!t || t.type === "empty") {
      return 0;
    }
    const p = (t as Task).parent;
    if (!p) {
      return 0;
    }
    return 1 + depthOf(p);
  };

  const parentIds = new Set<string>();
  list.forEach((t) => {
    if (t.parent) {
      parentIds.add(t.parent);
    }
  });

  const orderedParentIds = [...parentIds].sort(
    (a, b) => depthOf(b) - depthOf(a)
  );

  for (const parentId of orderedParentIds) {
    const pIdx = idToIndex.get(parentId);
    if (pIdx === undefined) {
      continue;
    }
    const parentRow = list[pIdx];
    if (parentRow.type === "empty") {
      continue;
    }

    const directChildren = list.filter(
      (c) => c.parent === parentId && c.type !== "empty"
    ) as Task[];

    if (directChildren.length === 0) {
      continue;
    }

    let start = directChildren[0].start;
    let end = directChildren[0].end;
    for (const c of directChildren) {
      if (c.start.getTime() < start.getTime()) {
        start = c.start;
      }
      if (c.end.getTime() > end.getTime()) {
        end = c.end;
      }
    }

    list[pIdx] = {
      ...(parentRow as Task),
      start: new Date(start),
      end: new Date(end),
    };
  }

  return list;
}
