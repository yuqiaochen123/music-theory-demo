import { getCurrentUser } from './auth.js';
import { setTutorAvailability } from './tutor-availability.js';
import { applyPreferences, loadPreferences } from './settings-preferences.js';

applyPreferences(loadPreferences());

export async function installAccountLinks() {
  const links = document.querySelectorAll('[data-account-link]');
  const homeAccount = document.querySelector('[data-home-account]');
  const homeAccountEmail = document.querySelector('[data-home-account-email]');
  const tutorSignedIn = document.querySelector('[data-tutor-signed-in]');
  const tutorSignedOut = document.querySelector('[data-tutor-signed-out]');
  if (!links.length && !homeAccount && !tutorSignedIn && !tutorSignedOut) return;
  try {
    const user = await getCurrentUser();
    const signedIn = Boolean(user && !user.is_anonymous);
    setTutorAvailability({ signedInElement: tutorSignedIn, signedOutElement: tutorSignedOut, signedIn });
    links.forEach(link => {
      link.textContent = signedIn ? 'Account' : 'Sign in';
      link.title = user?.email ?? 'Sign in to save progress';
    });
    if (homeAccount && homeAccountEmail && signedIn) {
      homeAccountEmail.textContent=user.email;
      homeAccount.hidden=false;
    }
  } catch {
    links.forEach(link => { link.textContent = 'Sign in'; });
    setTutorAvailability({ signedInElement: tutorSignedIn, signedOutElement: tutorSignedOut, signedIn: false });
  }
}

installAccountLinks();
