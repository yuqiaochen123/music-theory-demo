import assert from "node:assert/strict";
import { it } from "node:test";
import { buildSharedPracticeRegistry } from "./shared-practice-registry.js";
import { flattenExerciseBank } from "./daily-practice.js";

it("namespaces exercises by source grade", () => {
  const shared = buildSharedPracticeRegistry({
    2: { rhythm: { name: "Rhythm", exercises: [{ id: "one" }] } },
    5: { rhythm: { name: "Rhythm", exercises: [{ id: "one" }] } },
  });
  assert.deepEqual(flattenExerciseBank(shared).map(item => [item.grade, item.id]), [[2, "g2:one"], [5, "g5:one"]]);
});
