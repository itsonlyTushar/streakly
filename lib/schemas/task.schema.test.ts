import { describe, it, expect } from "vitest";
import { TaskSchema } from "./task.schema";

describe("TaskSchema", () => {
  it("normalizes legacy task documents that are missing createdAt and use older status values", () => {
    const legacyTask = {
      id: "task-1",
      userId: "user-1",
      title: "   ",
      description: null,
      projectId: null,
      status: "pending",
      priority: "normal",
      tags: ["study"],
      dueDate: null,
      subtasks: undefined,
      order: 1,
    };

    const parsed = TaskSchema.parse(legacyTask);

    expect(parsed.title).toBe("Untitled task");
    expect(parsed.status).toBe("Todo");
    expect(parsed.priority).toBe("None");
    expect(parsed.subtasks).toEqual([]);
    expect(parsed.createdAt).toBeNull();
  });
});
