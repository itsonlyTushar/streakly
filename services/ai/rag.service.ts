import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";

export interface UserProgressContext {
  activeGoals: { goal: string; dueDate: string }[];
  completedGoals: { goal: string; completedAt: string }[];
  notes: { content: string; date: string; goalText?: string }[];
  dsaProblems: {
    problemName: string;
    difficulty: string;
    topics: string[];
    intuition?: string;
    timeComplexity?: string;
    spaceComplexity?: string;
    dateLearned?: string;
    nextReviewDate?: string;
  }[];
  machineCoding: { questionName: string; approach: string; language: string }[];
}

// Helper function to format any date input into DD-MM-YYYY format
const formatDateToDDMMYYYY = (val: any): string => {
  if (!val) return "";
  
  // If it is a Firebase Timestamp
  if (typeof val === "object" && val.toMillis) {
    return format(new Date(val.toMillis()), "dd-MM-yyyy");
  }
  
  if (val instanceof Date) {
    return format(val, "dd-MM-yyyy");
  }
  
  if (typeof val === "string") {
    // If yyyy-MM-dd format (e.g. "2026-07-05")
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const [y, m, d] = val.split("-");
      return `${d}-${m}-${y}`;
    }
    // Otherwise try parsing as standard date string
    try {
      const parsed = new Date(val);
      if (!isNaN(parsed.getTime())) {
        return format(parsed, "dd-MM-yyyy");
      }
    } catch (_) {}
  }
  
  return String(val);
};

export const ragService = {
  // Fetch user data from Firestore and structure it
  getUserContext: async (userId: string): Promise<UserProgressContext> => {
    try {
      // 1. Fetch Goals
      const goalsRef = collection(db, "goals");
      const goalsQuery = query(goalsRef, where("userId", "==", userId));
      const goalsSnap = await getDocs(goalsQuery);
      
      const activeGoals: { goal: string; dueDate: string }[] = [];
      const completedGoals: { goal: string; completedAt: string }[] = [];
      const goalMap = new Map<string, string>(); // for mapping note goalId to goal text

      goalsSnap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        goalMap.set(docSnap.id, data.goal || "");
        if (data.status === "active") {
          activeGoals.push({
            goal: data.goal || "",
            dueDate: formatDateToDDMMYYYY(data.dueDate),
          });
        } else if (data.status === "completed") {
          completedGoals.push({
            goal: data.goal || "",
            completedAt: formatDateToDDMMYYYY(data.completedAt || data.completedDate),
          });
        }
      });

      // 2. Fetch Notes
      const notesRef = collection(db, "notes");
      const notesQuery = query(notesRef, where("userId", "==", userId));
      const notesSnap = await getDocs(notesQuery);

      const notes = notesSnap.docs.map((docSnap) => {
        const data = docSnap.data();
        const goalText = data.goalId ? goalMap.get(data.goalId) : undefined;
        return {
          content: data.content || "",
          date: formatDateToDDMMYYYY(data.dateString || data.date),
          goalText,
        };
      });

      // 3. Fetch DSA problems
      const dsaRef = collection(db, "dsa");
      const dsaQuery = query(dsaRef, where("userId", "==", userId));
      const dsaSnap = await getDocs(dsaQuery);

      const dsaProblems = dsaSnap.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          problemName: data.problemName || "",
          difficulty: data.difficulty || "Medium",
          topics: data.topics || [],
          intuition: data.intuition || undefined,
          timeComplexity: data.timeComplexity || undefined,
          spaceComplexity: data.spaceComplexity || undefined,
          dateLearned: data.dateLearned ? formatDateToDDMMYYYY(data.dateLearned) : undefined,
          nextReviewDate: data.nextReviewDate ? formatDateToDDMMYYYY(data.nextReviewDate) : undefined,
        };
      });

      // 4. Fetch Machine Coding
      const mcRef = collection(db, "machineCoding");
      const mcQuery = query(mcRef, where("userId", "==", userId));
      const mcSnap = await getDocs(mcQuery);

      const machineCoding = mcSnap.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          questionName: data.questionName || "",
          approach: data.approach || "",
          language: data.language || "JavaScript",
        };
      });

      return {
        activeGoals,
        completedGoals,
        notes,
        dsaProblems,
        machineCoding,
      };
    } catch (error) {
      console.error("Error gathering user context for RAG:", error);
      return {
        activeGoals: [],
        completedGoals: [],
        notes: [],
        dsaProblems: [],
        machineCoding: [],
      };
    }
  },

  // Build the textual context prompt from structured data
  buildContextString: (context: UserProgressContext): string => {
    let str = "USER'S CURRENT PROGRESS & CONTEXT:\n\n";

    str += "--- ACTIVE GOALS ---\n";
    if (context.activeGoals.length === 0) {
      str += "No active goals logged.\n";
    } else {
      context.activeGoals.forEach((g) => {
        str += `- Goal: "${g.goal}" (Target Due Date: ${g.dueDate})\n`;
      });
    }
    str += "\n";

    str += "--- COMPLETED GOALS ---\n";
    if (context.completedGoals.length === 0) {
      str += "No completed goals logged yet.\n";
    } else {
      context.completedGoals.forEach((g) => {
        str += `- Goal: "${g.goal}" (Completed on: ${g.completedAt})\n`;
      });
    }
    str += "\n";

    str += "--- STUDY NOTES & JOURNAL ---\n";
    if (context.notes.length === 0) {
      str += "No notes logged.\n";
    } else {
      context.notes.forEach((n) => {
        const goalStr = n.goalText ? ` for Goal "${n.goalText}"` : "";
        str += `- [${n.date}]${goalStr}: "${n.content}"\n`;
      });
    }
    str += "\n";

    str += "--- DSA VAULT (PROBLEMS LEARNED) ---\n";
    if (context.dsaProblems.length === 0) {
      str += "No DSA problems logged in the vault.\n";
    } else {
      context.dsaProblems.forEach((p) => {
        str += `- "${p.problemName}" (${p.difficulty} complexity)\n`;
        str += `  Topics: ${p.topics.join(", ") || "None"}\n`;
        if (p.timeComplexity || p.spaceComplexity) {
          str += `  Complexity: Time ${p.timeComplexity || "N/A"}, Space ${p.spaceComplexity || "N/A"}\n`;
        }
        if (p.dateLearned) {
          str += `  Learned Date: ${p.dateLearned}\n`;
        }
        if (p.nextReviewDate) {
          str += `  Next Review Date: ${p.nextReviewDate}\n`;
        }
        if (p.intuition) {
          str += `  Intuition: "${p.intuition}"\n`;
        }
      });
    }
    str += "\n";

    str += "--- MACHINE CODING CHALLENGES ---\n";
    if (context.machineCoding.length === 0) {
      str += "No machine coding tasks logged.\n";
    } else {
      context.machineCoding.forEach((mc) => {
        str += `- Question: "${mc.questionName}" (Language: ${mc.language})\n`;
        if (mc.approach) {
          str += `  Approach: "${mc.approach}"\n`;
        }
      });
    }

    return str;
  },

  // System Instructions builder
  getSystemInstruction: (contextString: string, today?: string): string => {
    const todayLine = today || new Date().toISOString().slice(0, 10);
    return `You are "Streakly AI Coach", a highly personalized, smart, and encouraging AI study companion.
Your job is to help the user reflect on their study goals, prepare for coding interviews (DSA & Machine Coding), review their learning notes, answer their questions, and add items to their workspace on request.

You have access to the user's real-time workspace data. Here is their current dashboard context:
${contextString}

Guidelines:
1. ANSWER ONLY WHAT IS ASKED: Be precise, direct, and address only the specific question asked. Avoid fluff, long preambles, or unrelated summaries.
2. STRICT DATE-LOOKUP RESTRICTION:
   - If the user asks about what they did, notes logged, goals due, or problems solved on a specific date (e.g. "what are my notes for 05-07-2026?" or "show notes of 05-07-2026"):
   - Inspect the context. If you DO NOT find any goals, notes, DSA problems, or tasks logged or due on that specific date (in DD-MM-YYYY format), you MUST respond with EXACTLY and ONLY this phrase:
     "nothing for that day i found"
     Do not say "Sorry", do not explain, do not add greetings. Output ONLY that single sentence.
   - If you DO find matching data for that specific day, display that data directly and answer the question concisely.
3. REFER TO THE USER'S SPECIFIC DATA: Always use the goals, problems, and notes above to make your answers deeply personalized when relevant data is found.
4. DSA & CODING ADVICE: When asked about a DSA topic or problem, check if they have solved something similar and connect it. Suggest optimal complexities (Time/Space) and coding intuition. Keep code snippets standard, clean, and in standard programming languages.
5. FORMATTING: Use Markdown formatting (bolding, lists, tables, headers, and code blocks) to make your output visually readable. Keep responses relatively concise so they fit well in a chat window.
6. WORKSPACE ACTIONS (adding items):
   When — and ONLY when — the user clearly asks to add, create, save, log, or track something, perform it by emitting a fenced code block labelled "action" containing a JSON object. Before the block, write ONE short sentence phrased as an action IN PROGRESS — e.g. "Adding that to your DSA Arena now…" — NOT a finished claim like "I've added it". Streakly actually runs the action and appends the real "✅ Added…" or "⚠️ Couldn't add…" line after your message, so never assert success yourself and never claim something is saved when you did not emit an action block for it. Never print the JSON anywhere except inside that block, and never wrap a normal answer or a code sample in an action block.

   Today's date is ${todayLine} (YYYY-MM-DD). Resolve any relative date the user gives ("today", "tomorrow", "next Monday", "in 3 days", "20 July") into an absolute "YYYY-MM-DD" string. If the user gives no date, use null.

   Supported actions (emit the exact JSON shape):

   - Add a DSA problem to the DSA Arena:
     \`\`\`action
     { "type": "add_dsa", "problemName": "Accounts Merge", "difficulty": "Medium", "topics": ["Union Find", "Graph", "DFS"], "timeComplexity": "O(n * α(n))", "spaceComplexity": "O(n)", "intuition": "## Approach\nUnion accounts that share an email using a Union Find data structure, then group each account by its set root to consolidate duplicates.", "problemUrl": "https://leetcode.com/problems/accounts-merge/", "nextReviewDate": null }
     \`\`\`
     Required: problemName. "difficulty" is one of "Easy" | "Medium" | "Hard" (default "Medium"). "topics" is an array of strings.
     RESOLVE PROBLEM REFERENCES: If the user identifies a problem by number or platform id — e.g. "LeetCode 721", "LC 721", "problem no. 721", "721 no problem", "#721", "leetcode 1. Two Sum" — figure out which ACTUAL problem that refers to and fill "problemName" with its real title (e.g. 721 → "Accounts Merge"), along with its real difficulty, topics, canonical "problemUrl" (https://leetcode.com/problems/<slug>/), and typical time/space complexity and intuition. The intuition MUST explain the optimized idea and why it works, formatted under the heading \`## Approach\`. NEVER copy the user's literal phrase (like "721 no leetcode problem") into "problemName". If you are not confident which problem a number maps to, do NOT guess or add a placeholder — instead ask the user to confirm the exact title first, and emit no action block.

   - Add a topic to SRS (spaced repetition revision):
     \`\`\`action
     { "type": "add_srs", "topic": "Sliding Window", "details": "Pattern for contiguous subarray/substring problems", "nextReviewDate": "2026-07-20" }
     \`\`\`
     Required: topic.

    - Add a task (optionally with a due date and subtasks):
      \`\`\`action
      { "type": "add_task", "title": "Revise binary search", "dueDate": "2026-07-16", "priority": "High", "description": null, "subtasks": ["Revise templates", "Solve 3 LC problems"] }
      \`\`\`
      Required: title. "priority" is one of "Urgent" | "High" | "Medium" | "Low" | "None" (default "None").
      "subtasks" is an array of strings (or objects like { "text": "subtask description", "done": false }). If the user asks to add subtasks (e.g. "and add subtasks A, B, C"), include them in this array.

   Action rules:
   - Only emit an action block when the user is asking to add/create something. For plain questions, DO NOT emit one.
   - When the user does not specify details (difficulty, topics, complexity), you MAY infer sensible values from your own knowledge.
   - To add several items at once, put a JSON array of these objects inside a single action block.
   - If the user says an item was not added, that it "didn't work", or asks you to "add it again", treat it as a fresh add request and emit the action block again to actually perform it — do NOT just insist it was already added.
`;
  },
};
