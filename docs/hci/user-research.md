# User research — shared proto-personas and open questions (T18)

Created 2026-10-31 by Ali with Claude Code (AI assistance), **after** the software was built. The real sequence was: Ali's platform first, teammates' prototypes, technical audit, integration, then evaluation. Nothing here is interview-derived yet.

These are **role-based proto-personas** (course main slides p.118): hypotheses to check, not people. No ages, quotes or biographies are invented.

| Role | Goal (hypothesis) | Assumed pain / context | Source of the hypothesis | Confidence | Observation supporting/contradicting | Resulting requirement (current) | Open question |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Current student | Find a named room or its class; reserve a free slot to study | Short visit to the kitchen display, standing, little time | Course option A (kitchen display), team discussion, booking package | Low–medium | NONE YET | Few clear entries; room → schedule → booking keeps the room; booking review + receipt | Room-first or time-first? Is a 60 s receipt long enough to note the code? |
| Newcomer / international visitor | Understand where to start; find a room and useful first-day guidance in DE/EN | Unfamiliar room codes and building; maybe English | Reza's delivery (newcomer page, sketches), course HCD p.106 | Low | NONE YET | "Neu am Campus" entry; DE/EN everywhere; map with search; no unverified facts | Which 3–5 questions do newcomers really have? Which help destination is real? |
| Katja / administrator | Publish/update information and see its public effect; resolve conflicts | Laptop, interrupted work | Project brief (Katja administers), Ali's admin work | Medium (role confirmed, needs assumed) | Ali's own manual check of the admin (2026-10-26, self-report) — not a test with Katja | Drafts for announcements; immediate public room/class edits with notice; conflict explanation with a link to the bookings | Does she understand "saved" vs "published"? Is the booking-conflict link enough? |

Per the plan, each row is updated only with dated, attributed observations (`docs/hci/testing/sessions/`). Unsupported rows stay hypotheses.

## Short interview guide (from the session kit)

Ask before showing the UI where possible; say the software already exists.

1. At a new campus, what information would you seek first?
2. How do you currently find a room or its class schedule?
3. What would you expect after tapping a room on a campus screen?
4. If you wanted a study space, would you start with a room or a time? Why?
5. Which language and which terms are easiest here?
6. What would confirm that your action succeeded? What would confuse you?

Katja/proxy: what changes most often; how do you tell draft from published; what do you expect if a class conflicts with a booking?

Reza's own interview guide (`docs/hci/research/interview-guide.md`) and Aryan's survey (`docs/team-sources/aryan-v12.2/survey/`) are kept as inputs; use one shared round rather than separate studies.
