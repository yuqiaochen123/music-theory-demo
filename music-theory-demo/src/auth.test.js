import assert from 'node:assert/strict';
import test from 'node:test';

import { passwordRecoveryRedirect, requestPasswordReset, updatePassword } from './auth.js';

test('uses the current web origin for password recovery links', () => {
  assert.equal(
    passwordRecoveryRedirect({ protocol: 'https:', origin: 'https://music.example', href: 'https://music.example/login.html' }),
    'https://music.example/login.html?mode=recovery',
  );
});

test('uses the configured local server instead of an unusable file URL', () => {
  assert.equal(
    passwordRecoveryRedirect({ protocol: 'file:', origin: 'null', href: 'file:///tmp/login.html' }),
    'http://localhost:3000/login.html?mode=recovery',
  );
});

test('requests a password recovery email with the safe redirect', async () => {
  const calls = [];
  const client = {
    auth: {
      async resetPasswordForEmail(email, options) {
        calls.push({ email, options });
        return { data: {}, error: null };
      },
    },
  };

  await requestPasswordReset(' learner@example.com ', {
    client,
    location: { protocol: 'https:', origin: 'https://music.example', href: 'https://music.example/login.html' },
  });

  assert.deepEqual(calls, [{
    email: 'learner@example.com',
    options: { redirectTo: 'https://music.example/login.html?mode=recovery' },
  }]);
});

test('updates the signed-in recovery session password', async () => {
  const calls = [];
  const client = { auth: { async updateUser(input) { calls.push(input); return { data: {}, error: null }; } } };
  await updatePassword('new secure password', { client });
  assert.deepEqual(calls, [{ password: 'new secure password' }]);
});
