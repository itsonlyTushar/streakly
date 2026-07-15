import { describe, it, expect } from "vitest";
import {
  extractActions,
  normalizeDifficulty,
  normalizeTaskPriority,
  parseActionDate,
} from "./actions";

describe("extractActions", () => {
  it("parses a single add_dsa action block and strips it from the text", () => {
    const raw =
      'Sure! Adding that now.\n\n```action\n{ "type": "add_dsa", "problemName": "Two Sum", "difficulty": "easy", "topics": ["Array"] }\n```';
    const { text, actions } = extractActions(raw);
    expect(text).toBe("Sure! Adding that now.");
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      type: "add_dsa",
      problemName: "Two Sum",
      topics: ["Array"],
    });
  });

  it("parses a task with a due date", () => {
    const raw =
      '```action\n{ "type": "add_task", "title": "Revise graphs", "dueDate": "2026-07-16", "priority": "High" }\n```';
    const { actions } = extractActions(raw);
    expect(actions[0]).toMatchObject({
      type: "add_task",
      title: "Revise graphs",
      dueDate: "2026-07-16",
    });
  });

  it("parses an array of actions in one block", () => {
    const raw =
      '```action\n[{ "type": "add_srs", "topic": "Sliding Window" }, { "type": "add_task", "title": "Do 2 mediums" }]\n```';
    const { actions } = extractActions(raw);
    expect(actions).toHaveLength(2);
    expect(actions[0].type).toBe("add_srs");
    expect(actions[1].type).toBe("add_task");
  });

  it("accepts a json-fenced block too", () => {
    const raw = '```json\n{ "type": "add_srs", "topic": "Two Pointers" }\n```';
    const { actions } = extractActions(raw);
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ type: "add_srs", topic: "Two Pointers" });
  });

  it("leaves regular code blocks and normal answers untouched", () => {
    const raw =
      "Here is a solution:\n\n```python\nprint('hi')\n```";
    const { text, actions } = extractActions(raw);
    expect(actions).toHaveLength(0);
    expect(text).toContain("```python");
  });

  it("ignores unknown action types", () => {
    const raw = '```action\n{ "type": "delete_everything" }\n```';
    const { actions } = extractActions(raw);
    expect(actions).toHaveLength(0);
  });
});

describe("normalizers", () => {
  it("normalizes fuzzy difficulty", () => {
    expect(normalizeDifficulty("easy")).toBe("Easy");
    expect(normalizeDifficulty("HARD")).toBe("Hard");
    expect(normalizeDifficulty(undefined)).toBe("Medium");
  });

  it("normalizes task priority", () => {
    expect(normalizeTaskPriority("urgent")).toBe("Urgent");
    expect(normalizeTaskPriority("low")).toBe("Low");
    expect(normalizeTaskPriority("")).toBe("None");
  });

  it("parses an ISO date at local noon (no timezone drift)", () => {
    const d = parseActionDate("2026-07-16");
    expect(d?.getFullYear()).toBe(2026);
    expect(d?.getMonth()).toBe(6); // July = 6
    expect(d?.getDate()).toBe(16);
    expect(parseActionDate(null)).toBeNull();
    expect(parseActionDate("not a date")).toBeNull();
  });
});
