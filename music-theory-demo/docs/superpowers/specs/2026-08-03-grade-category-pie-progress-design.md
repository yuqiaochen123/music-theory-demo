# Grade Category Pie Progress

## Goal

Add a compact pie-style progress indicator to each Grade 5 curriculum category page. The indicator occupies the open area immediately below the category heading and moves the existing topic-card grid downward without altering topic content or card dimensions.

## Presentation

- Place one circular progress indicator between the category heading and topic cards.
- Use the site palette: `#D2A36B` for completed progress and translucent `#F6F1E9` for the remainder.
- Display the category completion percentage in the centre of the circle.
- Keep the indicator visually secondary to the category heading and topic choices.
- Preserve the existing fixed-height, button-controlled curriculum pages without introducing vertical scrolling.

## Progress calculation

- Calculate each category's percentage from its visible topic cards and the existing Grade 5 saved-progress records.
- Treat a completed topic as 100%, an in-progress topic as its stored percentage, and an untouched topic as 0%.
- Use the average across topics in the category, rounded to the nearest whole percent.
- Display 0% when no saved progress is available or the visitor is signed out.
- Refresh the visible pies after saved progress loads.

## Responsive behaviour

- Keep the pie centred at desktop and mobile widths.
- Reduce its diameter on short or narrow screens so the topic list remains usable.
- Do not resize or rewrite existing topic cards.

## Accessibility

- Give each pie an accessible label containing the category name and percentage.
- Keep the percentage as visible text rather than relying on colour alone.
- Do not animate the pie when reduced motion is requested.

## Verification

- Add automated checks for the pie markup, styling, and saved-progress update path.
- Verify the existing Grade 5 curriculum navigation and lesson links remain unchanged.
