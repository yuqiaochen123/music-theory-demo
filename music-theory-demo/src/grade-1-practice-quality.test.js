import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { validateGrade1Example } from './grade-1-music.js';

function loadRegistries() {
  const window = {};
  const context = { window };
  for (const file of ['./grade-1-topic-data.js', './grade-1-practice-data.js']) {
    vm.runInNewContext(readFileSync(new URL(file, import.meta.url), 'utf8'), context);
  }
  return { topics: window.ListeningDeskGrade1Topics, practice: window.ListeningDeskGrade1Practice };
}

test('provides ten unambiguous exercises for every Grade 1 topic', () => {
  const { topics, practice } = loadRegistries();
  assert.deepEqual(Object.keys(practice), Object.keys(topics));
  for (const topic of Object.values(practice)) {
    assert.equal(topic.exercises.length, 10);
    assert.equal(new Set(topic.exercises.map(item => item.id)).size, 10);
    for (const item of topic.exercises) {
      assert.match(item.id, /^g1-/);
      assert.ok(item.prompt && item.answer);
      assert.equal(item.choices.filter(choice => choice === item.answer).length, 1);
      assert.ok(item.facts.length >= 2);
      assert.equal(validateGrade1Example(item), true);
    }
  }
  assert.equal(Object.values(practice).flatMap(topic => topic.exercises).length, 90);
});
