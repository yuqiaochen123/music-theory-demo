import test from 'node:test';
import assert from 'node:assert/strict';
import { setTutorAvailability } from './tutor-availability.js';

test('shows the ready message and hides the sign-in prompt for a signed-in learner', () => {
  const signedInElement = { hidden: true };
  const signedOutElement = { hidden: false };

  setTutorAvailability({ signedInElement, signedOutElement, signedIn: true });

  assert.equal(signedInElement.hidden, false);
  assert.equal(signedOutElement.hidden, true);
});

test('shows the sign-in prompt and hides the ready message for a signed-out learner', () => {
  const signedInElement = { hidden: false };
  const signedOutElement = { hidden: true };

  setTutorAvailability({ signedInElement, signedOutElement, signedIn: false });

  assert.equal(signedInElement.hidden, true);
  assert.equal(signedOutElement.hidden, false);
});
