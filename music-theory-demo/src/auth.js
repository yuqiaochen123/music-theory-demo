import { getSupabaseClient } from './progress-store.js';

export async function getCurrentUser() {
  const client = await getSupabaseClient();
  const { data, error } = await client.auth.getUser();
  if (error && !/session/i.test(error.message ?? '')) throw error;
  return data?.user ?? null;
}

export async function signIn(email, password) {
  const client = await getSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  return data;
}

export async function signUp(email, password) {
  const client = await getSupabaseClient();
  const { data, error } = await client.auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo: new URL('login.html', window.location.href).href },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const client = await getSupabaseClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export function passwordRecoveryRedirect(location = globalThis.location) {
  if (location.protocol === 'file:') return 'http://localhost:3000/login.html?mode=recovery';
  return new URL('login.html?mode=recovery', location.href).href;
}

export async function requestPasswordReset(email, { client, location = globalThis.location } = {}) {
  const db = client ?? await getSupabaseClient();
  const { data, error } = await db.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: passwordRecoveryRedirect(location),
  });
  if (error) throw error;
  return data;
}

export async function updatePassword(password, { client } = {}) {
  const db = client ?? await getSupabaseClient();
  const { data, error } = await db.auth.updateUser({ password });
  if (error) throw error;
  return data;
}

export async function observeAuth(callback, { client } = {}) {
  const db = client ?? await getSupabaseClient();
  return db.auth.onAuthStateChange(callback);
}
