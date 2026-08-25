import assert from 'node:assert/strict';
import test from 'node:test';

import * as auth from './auth.js';

const { passwordRecoveryRedirect, requestPasswordReset, updatePassword } = auth;

test('moves file pages to one local web origin while preserving page state', () => {
  assert.equal(typeof auth.canonicalLocalAppUrl, 'function');
  assert.equal(
    auth.canonicalLocalAppUrl({
      protocol: 'file:',
      pathname: '/Users/learner/Documents/music-theory-demo/grade-5.html',
      search: '?overlay=daily-practice',
      hash: '#today',
    }),
    'http://127.0.0.1:4173/grade-5.html?overlay=daily-practice#today',
  );
});

test('does not redirect pages that are already served over the web', () => {
  assert.equal(typeof auth.canonicalLocalAppUrl, 'function');
  assert.equal(
    auth.canonicalLocalAppUrl({
      protocol: 'http:',
      pathname: '/grade-5.html',
      search: '',
      hash: '',
    }),
    null,
  );
});

test('replaces a file URL with the canonical local app URL', () => {
  const redirects = [];
  const location = {
    protocol: 'file:',
    pathname: '/Users/learner/Documents/music-theory-demo/topic.html',
    search: '?topic=accidentals',
    hash: '',
    replace(url) { redirects.push(url); },
  };

  assert.equal(typeof auth.redirectFileAppToLocalServer, 'function');
  assert.equal(auth.redirectFileAppToLocalServer(location), true);
  assert.deepEqual(redirects, ['http://127.0.0.1:4173/topic.html?topic=accidentals']);
});

test('uses the current web origin for password recovery links', () => {
  assert.equal(
    passwordRecoveryRedirect({ protocol: 'https:', origin: 'https://music.example', href: 'https://music.example/login.html' }),
    'https://music.example/login.html?mode=recovery',
  );
});

test('uses the configured local server instead of an unusable file URL', () => {
  assert.equal(
    passwordRecoveryRedirect({
      protocol: 'file:',
      pathname: '/Users/learner/Documents/music-theory-demo/login.html',
      search: '',
      hash: '',
      origin: 'null',
      href: 'file:///Users/learner/Documents/music-theory-demo/login.html',
    }),
    'http://127.0.0.1:4173/login.html?mode=recovery',
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
