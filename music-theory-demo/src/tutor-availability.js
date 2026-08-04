export function setTutorAvailability({ signedInElement, signedOutElement, signedIn }) {
  if (signedInElement) signedInElement.hidden = !signedIn;
  if (signedOutElement) signedOutElement.hidden = signedIn;
}
