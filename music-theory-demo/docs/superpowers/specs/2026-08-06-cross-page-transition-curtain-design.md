# Cross-Page Transition Curtain Design

## Goal

Make navigation feel continuous in browsers that do not support cross-document View Transitions, without converting Listening Desk into a single-page application or disturbing existing page scripts, authentication, audio, URLs, or browser history.

## Confirmed limitation

The current in-app browser loads the shared transition stylesheet but reports no View Transitions API support. It therefore performs a normal multi-page document replacement. The early neutral root background prevents a white canvas, but it cannot visually bridge the hard swap by itself.

## Design

Add one fixed, viewport-sized transition curtain to every maintained HTML entry page. Its background uses the site's primary plum color and it sits above all page content only during same-origin navigation.

The shared navigation script will:

1. Prefetch eligible internal HTML destinations when a learner hovers, focuses, or touches a link.
2. On an eligible click, prevent immediate navigation, reveal the curtain with a short opacity transition, and store a short-lived arrival marker in `sessionStorage`.
3. Navigate as soon as the curtain fully covers the current document, with a timeout fallback so transition events cannot trap the learner.
4. On the destination's first paint, keep the identical curtain visible when the arrival marker is present, then fade it away after the page becomes ready.
5. Clear stale state on `pageshow`, including back-forward-cache restores, and remove the curtain if navigation is interrupted.

The existing native cross-document View Transition remains enabled. The curtain is used only when that capability is unavailable, preventing two transitions from running together.

## Eligibility and safety

Enhance only unmodified primary-button clicks on same-origin HTTP(S) links that do not target a new browsing context, download a file, or navigate only to an in-page hash. File URLs keep ordinary navigation because prefetch and origin semantics differ there.

Do not intercept form submissions, modified clicks, external destinations, downloads, or links with explicit targets. Native browser behavior remains the fallback whenever the script cannot confidently enhance a link.

If destination prefetch fails, navigation still proceeds after the curtain covers the page. No destination HTML is injected into the current document.

## Motion and accessibility

The curtain uses an opacity-only transition of 110 ms in and 140 ms out. It contains no text, spinner, movement, or focusable elements and is marked `aria-hidden="true"`. It never changes focus or announces content.

Under `prefers-reduced-motion: reduce`, the curtain switches visibility without animation and navigation begins immediately. The non-white root background remains active.

## Scope

Apply the shared curtain markup and behavior to:

- Grade selector
- Grade dashboards
- Grade 5 curriculum
- Lesson pages
- Practice pages
- Account page
- Notation proof page

No page content, layout, authentication behavior, exercise state, or music playback behavior changes are included.

## Verification

Use test-driven development to cover link eligibility, prefetch behavior, curtain state, navigation timing/fallback, arrival-state cleanup, reduced motion, and the presence of the shared layer on every maintained page.

Run the complete automated suite and production build. In the browser that lacks native View Transitions, verify grade selector → Grade 5 → lesson → practice → lesson and account navigation. Confirm the curtain is visually continuous, no white frame appears, the destination URL is correct, and the page is fully interactive after arrival.
