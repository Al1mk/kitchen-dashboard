# Reza — two sketch alternatives and decision

## Alternative A — task-first cards
The first screen asks a simple question: “Neu am Campus?” / “New to campus?” and shows three large actions: “Räume finden”, “Stundenplan ansehen”, “Aktuelle Hinweise”. A help card directs people to verified official university channels without inventing a contact person. This is the preferred starting point because it maps to users’ tasks, uses short labels and makes the next action visible.

## Alternative B — category-first dashboard
The first screen presents categories such as “Information”, “Gebäude”, “Studium”, “Kontakt”. This can scale to more content, but requires a newcomer to understand the categories before acting and might duplicate the existing global navigation.

## Current decision
Use Alternative A for the MVP. The first action should be understandable without reading a long explanation. Links currently point only to existing routes (`/rooms`, `/schedule`, `/display`). The map link must be changed only after Aryan’s `/map` route is merged and its room IDs/data are valid. Do not include unverified campus contacts, opening hours, floor numbers or real room claims.

## HCI rationale to validate
- Recognition over recall: visible task labels instead of requiring the user to remember menu names.
- Cognitive load: short sentences and few choices.
- Fitts’ Law: large, well-separated touch targets; exact physical usability must be checked on the real device.
- Feedback and error recovery: clear home path and no broken map links.
- Inclusive design: DE/EN, contrast, readable text, not color-only meaning.

Sketch date: [fill with the date actually drawn/reviewed]. These SVGs are proposed sketches, not screenshots of an implemented or tested page.
