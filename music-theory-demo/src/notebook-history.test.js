import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { groupNotebookHistory, notebookWindowStart } from "./notebook-history.js";

describe("seven-day notebook history", () => {
  it("uses Today plus the previous six local dates", () => assert.equal(notebookWindowStart("2026-08-26"), "2026-08-20"));
  it("groups recent review mistakes and excludes older rows", () => {
    const result = groupNotebookHistory({ today: "2026-08-26", items: [
      { id: "today", latest_mistake_date: "2026-08-26" },
      { id: "yesterday", latest_mistake_date: "2026-08-25" },
      { id: "oldest", latest_mistake_date: "2026-08-20" },
      { id: "hidden", latest_mistake_date: "2026-08-19" },
    ] });
    assert.deepEqual(result.today.map(item => item.id), ["today"]);
    assert.deepEqual(result.older.map(group => group.date), ["2026-08-25", "2026-08-20"]);
  });
  it("uses resolved_date for resolved rows", () => {
    const result = groupNotebookHistory({ today: "2026-08-26", status: "resolved", items: [{ id: "done", latest_mistake_date: "2026-08-20", resolved_date: "2026-08-26" }] });
    assert.equal(result.today[0].id, "done");
  });
});
