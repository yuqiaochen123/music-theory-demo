# Category Progress Animation

## Goal

Make each Grade 5 category progress ring reveal its saved percentage gradually instead of jumping immediately to the final value.

## Behaviour

- When saved category progress is rendered, begin the visible ring at 0% and animate it to the calculated percentage over 1.8 seconds.
- Animate the conic-gradient angle and the visible percentage number together so they remain synchronized throughout the reveal.
- Use a smoothstep curve so the circumference begins gently, remains visibly in motion, and settles gently at the target.
- Cache the progress already loaded by the grade picker for the current tab so the animation begins immediately after navigation instead of waiting for another database read.
- Refresh saved progress in the background without restarting an animation whose target has not changed.
- Continue to expose the final category name and percentage immediately through the ring's accessible label.
- If the visitor prefers reduced motion, skip the animation and render the final angle and number immediately.
- If a category's target is 0%, render 0% without running a needless animation.

## Implementation

Add a focused animation helper in `src/progress-ui.js` driven by `requestAnimationFrame`. The helper will accept the indicator, target percentage, duration, and motion preference. `renderCategoryProgress` will retain the existing progress calculation and delegate only the visual reveal to this helper.

The helper will derive each frame from elapsed time rather than incrementing a counter. This keeps the animation duration stable if frames are delayed and guarantees that the final frame lands exactly on the target percentage and angle.

The existing CSS transition on the conic-gradient background will be removed because JavaScript will control the animation frames directly.

## Testing

- Verify that the animation starts at 0, progresses over the requested duration, and ends at the exact target percentage and angle.
- Verify that reduced-motion mode renders the target immediately.
- Verify that 0% renders immediately.
- Run the existing progress UI and integration tests to protect progress calculations, accessible labels, and saved-progress loading.

## Out of Scope

- Changes to progress calculations, data storage, colors, ring size, layout, navigation, or topic cards.
- Animating progress rings on unrelated pages.
