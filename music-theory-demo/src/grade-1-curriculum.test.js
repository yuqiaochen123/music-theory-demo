import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { GRADE_1_TOPIC_IDS, assertGrade1Syllabus, validateGrade1Example } from './grade-1-music.js';

function loadTopics() {
  const window = {};
  vm.runInNewContext(readFileSync(new URL('./grade-1-topic-data.js', import.meta.url), 'utf8'), { window });
  return window.ListeningDeskGrade1Topics;
}

test('defines the complete approved Grade 1 curriculum', () => {
  const topics = loadTopics();
  assert.deepEqual(Object.keys(topics), GRADE_1_TOPIC_IDS);
  assert.equal(assertGrade1Syllabus(topics), true);
});

test('provides four substantial and playable examples for every Grade 1 topic', () => {
  const topics = loadTopics();
  Object.values(topics).forEach(topic => {
    assert.ok(topic.name && topic.title && topic.subtitle && topic.intro && topic.syllabus);
    assert.equal(topic.examples.length, 4);
    topic.examples.forEach(example => {
      assert.ok(example.label && example.rule && example.explanation);
      assert.equal(validateGrade1Example(example), true);
      assert.deepEqual(example.parts[0][1], example.midis);
    });
  });
});
