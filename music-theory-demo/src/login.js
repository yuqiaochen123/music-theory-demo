import { getCurrentUser, observeAuth, redirectFileAppToLocalServer, requestPasswordReset, signIn, signOut, signUp, updatePassword } from './auth.js';

redirectFileAppToLocalServer();

const form = document.querySelector('#auth-form');
const status = document.querySelector('#auth-status');
const account = document.querySelector('#account-panel');
const submit = document.querySelector('#auth-submit');
const signupSubmit = document.querySelector('#signup-submit');
const forgotPassword = document.querySelector('#forgot-password');
const resetForm = document.querySelector('#password-reset-form');
const resetSubmit = document.querySelector('#password-reset-submit');
let recoveringPassword = false;

function message(text, error = false) {
  status.textContent = text;
  status.dataset.error = String(error);
}

async function refresh() {
  const user = await getCurrentUser();
  const signedIn = user && !user.is_anonymous;
  if (recoveringPassword) return;
  form.hidden = Boolean(signedIn);
  account.hidden = !signedIn;
  if (signedIn) document.querySelector('#account-email').textContent = user.email;
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const mode = event.submitter?.dataset.authAction ?? 'signin';
  submit.disabled = true;
  signupSubmit.disabled = true;
  const clickedButton = mode === 'signin' ? submit : signupSubmit;
  const originalLabel = clickedButton.textContent;
  clickedButton.textContent = mode === 'signin' ? 'Signing in…' : 'Creating account…';
  form.elements.password.autocomplete = mode === 'signin' ? 'current-password' : 'new-password';
  message(mode === 'signin' ? 'Signing in…' : 'Creating your account…');
  const fields = new FormData(form);
  try {
    const data = mode === 'signin'
      ? await signIn(fields.get('email'), fields.get('password'))
      : await signUp(fields.get('email'), fields.get('password'));
    if (mode === 'signup' && !data.session) {
      message('If this is a new account, check your email to confirm it. If you already have an account, sign in or use “Forgot password?”.');
    } else {
      window.location.href = new URLSearchParams(location.search).get('returnTo') || 'index.html';
    }
  } catch (error) {
    message(error.message || 'Authentication failed. Please try again.', true);
  } finally {
    submit.disabled = false;
    signupSubmit.disabled = false;
    clickedButton.textContent = originalLabel;
  }
});

signupSubmit.addEventListener('click', () => {
  message('Checking your details…');
});

forgotPassword.addEventListener('click', async () => {
  const email = form.elements.email;
  if (!email.reportValidity()) return;
  forgotPassword.disabled = true;
  message('Requesting a secure password-reset email…');
  try {
    await requestPasswordReset(email.value);
    message('If an account exists for that address, a password-reset email is on its way. Check spam as well.');
  } catch (error) {
    message(error.message || 'Unable to send the password-reset email. Please try again.', true);
  } finally {
    forgotPassword.disabled = false;
  }
});

function showPasswordRecovery() {
  recoveringPassword = true;
  form.hidden = true;
  account.hidden = true;
  resetForm.hidden = false;
  message('Choose a new password for your account.');
  resetForm.elements.newPassword.focus();
}

resetForm.addEventListener('submit', async event => {
  event.preventDefault();
  const password = resetForm.elements.newPassword.value;
  if (password !== resetForm.elements.confirmPassword.value) {
    message('The two passwords do not match.', true);
    return;
  }
  resetSubmit.disabled = true;
  resetSubmit.textContent = 'Saving…';
  try {
    await updatePassword(password);
    recoveringPassword = false;
    resetForm.hidden = true;
    await refresh();
    message('Password updated. You are signed in and can continue learning.');
  } catch (error) {
    message(error.message || 'Unable to update the password. Request a new recovery email and try again.', true);
  } finally {
    resetSubmit.disabled = false;
    resetSubmit.textContent = 'Save new password';
  }
});

observeAuth(event => {
  if (event === 'PASSWORD_RECOVERY') showPasswordRecovery();
}).catch(error => message(error.message || 'Unable to start account recovery.', true));

if (new URLSearchParams(location.search).get('mode') === 'recovery') {
  message('Verifying your password-recovery link…');
}

form.addEventListener('invalid', event => {
  const field = event.target;
  if (field !== form.querySelector(':invalid')) return;
  if (field.name === 'email') {
    message(field.value ? 'Enter a valid email address.' : 'Enter your email address.', true);
  } else if (field.name === 'password') {
    message(field.value ? 'Use a password with at least 8 characters.' : 'Enter a password.', true);
  }
}, true);

document.querySelector('#sign-out').addEventListener('click', async () => {
  await signOut();
  await refresh();
  message('You are signed out.');
});

message('Use the account that owns your progress.');
refresh().catch(error => message(error.message, true));
