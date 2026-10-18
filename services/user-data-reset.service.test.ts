import {
  doc,
  getDocs,
  where,
  writeBatch,
} from "firebase/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearAppBrowserData, resetUserData } from "./user-data-reset.service";

describe("user data reset service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    vi.mocked(doc).mockImplementation(
      (_database, collectionName, documentId) =>
        ({ path: `${collectionName}/${documentId}` }) as never
    );
  });

  it("deletes the signed-in user's records in batches below Firestore's limit", async () => {
    const snapshots = Array.from({ length: 451 }, (_, index) => ({
      ref: { id: `record-${index}` },
    }));
    vi.mocked(getDocs).mockResolvedValue({ docs: snapshots } as never);

    const batches: Array<{
      deletedRefs: unknown[];
      delete: ReturnType<typeof vi.fn>;
      commit: ReturnType<typeof vi.fn>;
    }> = [];

    vi.mocked(writeBatch).mockImplementation(() => {
      const batch = {
        deletedRefs: [] as unknown[],
        delete: vi.fn((reference: unknown) => batch.deletedRefs.push(reference)),
        commit: vi.fn().mockResolvedValue(undefined),
      };
      batches.push(batch);
      return batch as never;
    });

    await resetUserData("user-123");

    expect(where).toHaveBeenCalledTimes(8);
    for (let index = 1; index <= 8; index += 1) {
      expect(where).toHaveBeenNthCalledWith(index, "userId", "==", "user-123");
    }
    expect(batches).toHaveLength(9);
    expect(batches.map((batch) => batch.deletedRefs.length)).toEqual([
      450, 450, 450, 450, 450, 450, 450, 450, 10,
    ]);
    expect(batches.every((batch) => batch.commit.mock.calls.length === 1)).toBe(true);
  });

  it("does not query Firestore without a signed-in user ID", async () => {
    await expect(resetUserData("")).rejects.toThrow(
      "A signed-in user is required to reset account data."
    );
    expect(getDocs).not.toHaveBeenCalled();
  });

  it("clears Streakly browser data without clearing Firebase authentication", () => {
    localStorage.setItem("streakly:dsa:gemini_api_key", "api-key");
    localStorage.setItem("streakly-compiler-code", "print('saved')");
    localStorage.setItem("streakly:ai_assistant:history:user-123", "history");
    localStorage.setItem("firebase:authUser:project:[DEFAULT]", "auth-state");
    localStorage.setItem("other-app-setting", "keep");

    clearAppBrowserData();

    expect(localStorage.getItem("streakly:dsa:gemini_api_key")).toBeNull();
    expect(localStorage.getItem("streakly-compiler-code")).toBeNull();
    expect(
      localStorage.getItem("streakly:ai_assistant:history:user-123")
    ).toBeNull();
    expect(
      localStorage.getItem("firebase:authUser:project:[DEFAULT]")
    ).toBe("auth-state");
    expect(localStorage.getItem("other-app-setting")).toBe("keep");
  });
});
