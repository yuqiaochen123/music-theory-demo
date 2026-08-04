import assert from 'node:assert/strict';
import test from 'node:test';

import { buildIncorrectFeedback, buildTutorRequest, createTutorController } from './ai-tutor-ui.js';

class FakeElement {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName;
    this.ownerDocument = ownerDocument;
    this.children = [];
    this.className = '';
    this.textContent = '';
  }

  append(...children) {
    children.forEach(child => { child.parent = this; });
    this.children.push(...children);
  }

  remove() {
    const index = this.parent?.children.indexOf(this) ?? -1;
    if (index >= 0) this.parent.children.splice(index, 1);
  }

  querySelector(selector) {
    return this.children.find(child => `.${child.className}` === selector) ?? null;
  }
}

function fixture() {
  const document = { createElement: tagName => new FakeElement(tagName, document) };
  const feedback = new FakeElement('div', document);
  const deterministic = new FakeElement('strong', document);
  deterministic.textContent = 'Not quite.';
  feedback.append(deterministic);
  return { feedback, deterministic };
}

test('appends an unobtrusive loading region without replacing deterministic feedback', async () => {
  const { feedback, deterministic } = fixture();
  let resolve;
  const result = new Promise(done => { resolve = done; });
  const controller = createTutorController({ feedbackElement: feedback, requestExplanation: () => result });

  const pending = controller.explain({ exerciseId: 'one' });
  assert.equal(feedback.children[0], deterministic);
  assert.equal(feedback.children[1].className, 'tutor-feedback');
  assert.match(feedback.children[1].textContent, /preparing/i);
  resolve(null);
  await pending;
});

test('renders successful model output as text in the tutor region', async () => {
  const { feedback } = fixture();
  const controller = createTutorController({
    feedbackElement: feedback,
    requestExplanation: async () => ({ explanation: '<b>C to E is four semitones.</b>', tip: 'Count each half-step.' }),
  });

  await controller.explain({ exerciseId: 'one' });
  const region = feedback.children[1];
  assert.equal(region.children[0].textContent, 'AI tutor');
  assert.equal(region.children[1].textContent, '<b>C to E is four semitones.</b>');
  assert.equal(region.children[2].textContent, 'Try this: Count each half-step.');
});

test('shows an exercise-specific answer guide when the AI request fails', async () => {
  const { feedback, deterministic } = fixture();
  const controller = createTutorController({ feedbackElement: feedback, requestExplanation: async () => null });

  await controller.explain({
    exerciseId: 'rnv-3',
    selectedAnswer: 'Raises a pitch',
    correctAnswer: 'Joins durations of the same pitch',
    facts: ['Musical detail: The tied notes sound as one.'],
  });

  const region = feedback.children[1];
  assert.equal(feedback.children[0], deterministic);
  assert.equal(region.children[0].textContent, 'Answer guide');
  assert.match(region.children[1].textContent, /Joins durations of the same pitch/);
  assert.match(region.children[1].textContent, /tied notes sound as one/i);
});

test('reset prevents a stale response from appearing on the next question', async () => {
  const { feedback, deterministic } = fixture();
  let resolve;
  const result = new Promise(done => { resolve = done; });
  const controller = createTutorController({ feedbackElement: feedback, requestExplanation: () => result });

  const pending = controller.explain({ exerciseId: 'one' });
  controller.reset();
  resolve({ explanation: 'Old answer', tip: 'Old tip' });
  await pending;

  assert.deepEqual(feedback.children, [deterministic]);
});

test('builds bounded trusted facts from a practice record', () => {
  const result = buildTutorRequest({
    topicId: 'intervals',
    exerciseId: 'interval-1',
    question: {
      prompt: 'What interval is shown?',
      answer: 'major',
      choices: ['major', 'minor'],
      notes: ['c/4', 'e/4'],
      midis: [60, 64],
      ignored: '<untrusted>',
    },
    selectedAnswer: 'minor',
    defaultPrompt: 'Identify the interval.',
  });

  assert.deepEqual(result, {
    topicId: 'intervals',
    exerciseId: 'interval-1',
    prompt: 'What interval is shown?',
    selectedAnswer: 'minor',
    correctAnswer: 'major',
    facts: [
      'Available choices: major, minor',
      'Written notes: c/4, e/4',
      'Playback MIDI pitches: 60, 64',
    ],
  });
});

test('sends the exact tie exercise and its visual and musical clues', () => {
  const result = buildTutorRequest({
    topicId: 'rhythm-note-values',
    exerciseId: 'rnv-3',
    question: {
      prompt: 'What does a tie do?',
      answer: 'Joins durations of the same pitch',
      choices: ['Joins durations of the same pitch', 'Raises a pitch', 'Shortens a note'],
      concept: { symbol: '⌒', detail: 'The tied notes sound as one.' },
    },
    selectedAnswer: 'Raises a pitch',
    defaultPrompt: 'Identify the rhythm.',
  });

  assert.equal(result.prompt, 'What does a tie do?');
  assert.equal(result.selectedAnswer, 'Raises a pitch');
  assert.equal(result.correctAnswer, 'Joins durations of the same pitch');
  assert.deepEqual(result.facts, [
    'Available choices: Joins durations of the same pitch, Raises a pitch, Shortens a note',
    'Visual clue: ⌒',
    'Musical detail: The tied notes sound as one.',
  ]);
});

test('builds immediate feedback for the exact exercise instead of a generic listening message', () => {
  const feedback = buildIncorrectFeedback({
    correctAnswer: 'Joins durations of the same pitch',
    facts: ['Musical detail: The tied notes sound as one.'],
  });

  assert.equal(
    feedback,
    'The correct answer is “Joins durations of the same pitch”. The tied notes sound as one.',
  );
  assert.doesNotMatch(feedback, /movement between the notes/i);
});

test('keeps the complete explanation visible and chat collapsed until clicked', async () => {
  const { feedback } = fixture();
  const controller = createTutorController({
    feedbackElement: feedback,
    requestExplanation: async () => ({ explanation: 'A tie combines the durations.', tip: 'Look for the curved line.' }),
  });

  await controller.explain({
    exerciseId: 'rnv-3',
    selectedAnswer: 'Raises a pitch',
    correctAnswer: 'Joins durations of the same pitch',
    facts: ['Musical detail: The tied notes sound as one.'],
  });

  const region = feedback.children[1];
  assert.equal(region.children[1].textContent, 'A tie combines the durations.');
  assert.equal(region.children[3].className, 'tutor-chat__toggle');
  assert.equal(region.children[3].textContent, 'Ask a follow-up');
  assert.equal(region.children[4].className, 'tutor-chat');
  assert.equal(region.children[4].hidden, true);

  region.children[3].onclick();
  assert.equal(region.children[4].hidden, false);
  assert.equal(region.children[3].textContent, 'Close chat');
});

test('asks a grounded follow-up with the prior explanation and renders chat bubbles', async () => {
  const { feedback } = fixture();
  const requests = [];
  const responses = [
    { explanation: 'A tie combines durations.', tip: 'Look for the curve.' },
    { explanation: 'Two tied crotchets last for two beats.', tip: 'Add one beat plus one beat.' },
  ];
  const controller = createTutorController({
    feedbackElement: feedback,
    requestExplanation: async input => {
      requests.push(input);
      return responses.shift();
    },
  });
  const exercise = {
    exerciseId: 'rnv-3',
    selectedAnswer: 'Raises a pitch',
    correctAnswer: 'Joins durations of the same pitch',
    facts: ['Musical detail: The tied notes sound as one.'],
  };

  await controller.explain(exercise);
  const result = await controller.ask('What happens with two crotchets?');

  assert.equal(result.explanation, 'Two tied crotchets last for two beats.');
  assert.equal(requests[1].followUpQuestion, 'What happens with two crotchets?');
  assert.deepEqual(requests[1].history, [{
    role: 'assistant',
    content: 'A tie combines durations. Try this: Look for the curve.',
  }]);
  const messages = feedback.children[1].children[4].children[0];
  assert.equal(messages.children[0].className, 'tutor-chat__message tutor-chat__message--user');
  assert.equal(messages.children[0].textContent, 'What happens with two crotchets?');
  assert.equal(messages.children[1].className, 'tutor-chat__message tutor-chat__message--assistant');
  assert.match(messages.children[1].textContent, /Two tied crotchets last for two beats/);
});

test('reset clears the prior exercise conversation', async () => {
  const { feedback } = fixture();
  const controller = createTutorController({
    feedbackElement: feedback,
    requestExplanation: async () => ({ explanation: 'Initial explanation.', tip: 'Initial tip.' }),
  });

  await controller.explain({ exerciseId: 'one', selectedAnswer: 'A', correctAnswer: 'B', facts: [] });
  controller.reset();

  assert.equal(await controller.ask('Does this leak into the next exercise?'), null);
  assert.equal(feedback.children.length, 1);
});
