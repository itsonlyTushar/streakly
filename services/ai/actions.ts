/* ──────────────────────────────────────────────────────────
   AI Coach action protocol

   The Gemini model can ask Streakly to add items to the user's
   workspace by emitting a fenced code block labelled "action"
   (or "json") containing a JSON object — or an array of them:

     ```action
     { "type": "add_dsa", "problemName": "Two Sum", "difficulty": "Easy" }
     ```

   `extractActions` pulls those blocks out of the reply, returns
   the recognized actions, and strips them from the text so the
   user never sees raw JSON. Regular code blocks are left intact.
   ────────────────────────────────────────────────────────── */

export type CoachActionType = "add_dsa" | "add_srs" | "add_task";

export interface AddDsaAction {
  type: "add_dsa";
  problemName: string;
  difficulty?: string;
  topics?: string[];
  intuition?: string;
  statement?: string;
  actuallyAsking?: string;
  pattern?: string;
  keyObservation?: string;
  maintainedState?: string;
  whyItWorks?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  problemUrl?: string;
  nextReviewDate?: string | null;
}

export interface AddSrsAction {
  type: "add_srs";
  topic: string;
  details?: string;
  nextReviewDate?: string | null;
}

export interface AddTaskAction {
  type: "add_task";
  title: string;
  dueDate?: string | null;
  priority?: string;
  description?: string;
  subtasks?: { id: string; text: string; done: boolean }[];
}

export type CoachAction = AddDsaAction | AddSrsAction | AddTaskAction;

/* ── small coercion helpers ──────────────────────────────── */
function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => str(x)).filter(Boolean);
  if (typeof v === "string") {
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function toSubtasksArray(v: unknown): { id: string; text: string; done: boolean }[] {
  const list: { id: string; text: string; done: boolean }[] = [];
  const genId = () =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

  if (Array.isArray(v)) {
    for (const item of v) {
      if (typeof item === "string" && item.trim()) {
        list.push({ id: genId(), text: item.trim(), done: false });
      } else if (item && typeof item === "object") {
        const text = str(item.text || item.title || item.name);
        if (text) {
          list.push({ id: genId(), text, done: !!item.done });
        }
      }
    }
  } else if (typeof v === "string" && v.trim()) {
    const items = v
      .split(/[\n,]+/)
      .map((s) => s.replace(/^[-*•\s]+/, "").trim())
      .filter(Boolean);
    for (const text of items) {
      list.push({ id: genId(), text, done: false });
    }
  }
  return list;
}

/* ── enum normalization (models are fuzzy about casing) ──── */
export function normalizeDifficulty(v?: string): "Easy" | "Medium" | "Hard" {
  const s = (v || "").toLowerCase();
  if (s.startsWith("e")) return "Easy";
  if (s.startsWith("h")) return "Hard";
  return "Medium";
}

export function normalizeTaskPriority(
  v?: string,
): "Urgent" | "High" | "Medium" | "Low" | "None" {
  const s = (v || "").toLowerCase();
  if (s.startsWith("u")) return "Urgent";
  if (s.startsWith("h")) return "High";
  if (s.startsWith("m")) return "Medium";
  if (s.startsWith("l")) return "Low";
  return "None";
}

/* Parse an ISO "YYYY-MM-DD" (or any Date-parseable string) into a
   local Date at noon, so timezone offsets can't shift the day. */
export function parseActionDate(v?: string | null): Date | null {
  if (!v || typeof v !== "string") return null;
  const iso = v.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), 12, 0, 0, 0);
  }
  const parsed = new Date(v);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function actionAreaLabel(type: CoachActionType): string {
  switch (type) {
    case "add_dsa":
      return "DSA Arena";
    case "add_srs":
      return "SRS";
    case "add_task":
      return "Tasks";
  }
}

/* Turn one raw JSON object into a validated CoachAction (or null). */
function normalizeAction(item: any): CoachAction | null {
  if (!item || typeof item !== "object") return null;
  const type = String(item.type || item.action || "").toLowerCase();

  if (type === "add_dsa" || type === "dsa") {
    const problemName = str(item.problemName || item.name || item.problem);
    if (!problemName) return null;
    return {
      type: "add_dsa",
      problemName,
      difficulty: str(item.difficulty) || undefined,
      topics: toStringArray(item.topics ?? item.tags),
      intuition: str(item.intuition) || undefined,
      statement: str(item.statement) || undefined,
      actuallyAsking: str(item.actuallyAsking) || undefined,
      pattern: str(item.pattern) || undefined,
      keyObservation: str(item.keyObservation) || undefined,
      maintainedState: str(item.maintainedState) || undefined,
      whyItWorks: str(item.whyItWorks || item.whyDoesItWork) || undefined,
      timeComplexity: str(item.timeComplexity) || undefined,
      spaceComplexity: str(item.spaceComplexity) || undefined,
      problemUrl: str(item.problemUrl || item.url || item.link) || undefined,
      nextReviewDate: item.nextReviewDate ?? null,
    };
  }

  if (type === "add_srs" || type === "srs") {
    const topic = str(item.topic || item.name || item.title);
    if (!topic) return null;
    return {
      type: "add_srs",
      topic,
      details: str(item.details || item.description) || undefined,
      nextReviewDate: item.nextReviewDate ?? item.reviewDate ?? null,
    };
  }

  if (type === "add_task" || type === "task") {
    const title = str(item.title || item.name || item.task);
    if (!title) return null;
    return {
      type: "add_task",
      title,
      dueDate: item.dueDate ?? item.due ?? null,
      priority: str(item.priority) || undefined,
      description: str(item.description) || undefined,
      subtasks: toSubtasksArray(item.subtasks ?? item.subTask ?? item.sub_tasks ?? item.subTasks),
    };
  }

  return null;
}

const FENCE = /```(?:action|json)\s*([\s\S]*?)```/gi;

export function extractActions(raw: string): { text: string; actions: CoachAction[] } {
  const actions: CoachAction[] = [];

  const text = raw
    .replace(FENCE, (full, body: string) => {
      try {
        const parsed = JSON.parse(body.trim());
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        const found = arr
          .map(normalizeAction)
          .filter((a): a is CoachAction => a !== null);
        if (found.length > 0) {
          actions.push(...found);
          return ""; // strip recognized action blocks from the visible reply
        }
      } catch {
        // not JSON (e.g. a real code sample) — leave it untouched
      }
      return full;
    })
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { text, actions };
}
