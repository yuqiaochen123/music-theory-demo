# Seamless Page Transitions Design

## Goal

Remove the white frame that appears during navigation between Listening Desk pages while preserving the current page layouts, URLs, browser history, authentication state, and accessibility behavior.

## Root cause

The site uses normal multi-page navigation. During document replacement, the browser can briefly paint its default white canvas before the destination page's external styles establish the root and body backgrounds. The destination pages also use several different body backgrounds, making that intermediate white paint conspicuous.

## Design

Use the browser's native cross-document View Transitions support for same-origin page navigations. Add the opt-in and a restrained 150 ms opacity crossfade to the stylesheet shared by every application page. Do not animate position, scale, or individual components.

Give the root element an explicit fallback background that matches the site's neutral shell. Put the critical background declaration in each page head before external styles so the destination document never begins from the browser's white default. Page-specific styles may continue to replace that neutral background once loaded.

Browsers without cross-document View Transitions continue to use ordinary navigation, with the early root background preventing the white flash. Under `prefers-reduced-motion: reduce`, disable transition animation while retaining the background fix.

## Scope

Apply the behavior to all maintained HTML entry pages:

- Grade selector
- Grade dashboards
- Grade 5 curriculum
- Lesson pages
- Practice pages
- Account page
- Notation proof page

No routing architecture, page content, controls, authentication flow, or existing component animation changes are included.

## Verification

Add an automated contract test that enumerates maintained HTML entry pages and verifies:

- Critical root background styling appears before external stylesheets.
- The shared stylesheet opts into cross-document transitions.
- The transition duration remains short and reduced-motion is honored.

Run the complete test suite and production build. Then exercise representative navigation paths in the local browser: grade selector to Grade 5, Grade 5 to lesson, lesson to practice, practice back to lesson, and navigation to the account page.
