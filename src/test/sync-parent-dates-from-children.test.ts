import { describe, expect, it } from "vitest";

import { syncParentDateRangeFromChildren } from "../helpers/sync-parent-dates-from-children";
import type { Task } from "../types/public-types";

const base = (): Task => ({
  id: "root",
  type: "project",
  name: "Root",
  start: new Date(2025, 0, 1),
  end: new Date(2025, 0, 10),
  progress: 0,
});

describe("syncParentDateRangeFromChildren", () => {
  it("does not infinite-loop on A ↔ B parent cycle", () => {
    const a: Task = {
      ...base(),
      id: "a",
      parent: "b",
      name: "A",
    };
    const b: Task = {
      ...base(),
      id: "b",
      parent: "a",
      name: "B",
    };
    expect(() => syncParentDateRangeFromChildren([a, b])).not.toThrow();
  });

  it("does not infinite-loop on self-parent", () => {
    const selfParent: Task = {
      ...base(),
      id: "x",
      parent: "x",
      name: "X",
    };
    expect(() => syncParentDateRangeFromChildren([selfParent])).not.toThrow();
  });
});
