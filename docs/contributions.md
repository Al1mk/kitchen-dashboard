# Contribution and provenance ledger

Started 2026-10-31 (Europe/Berlin) on branch `integrate/team-v1-20261031`, based on `main` at `4ae9808`. This ledger records **who supplied what**, how it entered the repository, and which later changes are integration work. It is updated at every import/integration checkpoint.

## 1. Source packages (immutable inputs)

The three packages live outside the repository, under the course `Project/` folder. They are never edited. On 2026-10-31 all **67 files** were re-hashed against `docs/evidence/team-audit-2026-10-31/source-manifest.json`: 67/67 identical SHA-256, no missing files, no unlisted files.

| Package folder | Supplied by (supported attribution) | Confidence | Content |
| --- | --- | --- | --- |
| `LCC_K1_COMPLETE_V12_2_QA_VERIFIED_aryan` | **Aryan** (spelled "Arian" in the older README) | Identified by the submission and by Ali | Original map V12.2 ZIP (3 floor illustrations, 47 room/area records, coordinates, search/floor/zoom, DE/EN), separate Netlify demo ZIP, survey ZIP, reported QA files |
| `Parsa_Aryan_SOURCE_FINAL_Fuer_Ali (2)` | **Aryan and Parsa, jointly** | Joint delivery confirmed by Ali; **internal split UNKNOWN** | Modified map (adds unpositioned K1-114, booking action, `?raum` handling), booking UI/API/SQLite repository/migration/guards, 8 unit tests, seed script, installers, docs |
| `Reza_HCI_Final_Pack` | **Reza** | Identified by Ali | Static `/newcomers` route + content, standalone HTML prototype, two SVG sketches, five-page booklet draft (MD/DOCX/PDF), screen/interview/test templates, two patch suggestions |

Ali stated on 2026-10-31 that he does not know how Aryan and Parsa divided the joint work. Older package labels ("Parsa's booking") are **not** treated as proof of sole authorship. Until both members clarify, every file from the joint package is attributed to "Aryan and Parsa (joint)".

## 2. Commit attribution rules used in this branch

- **Original contributor imports** (verbatim files from a package, or the package's own scripted patch output) are committed with the contributor **name only and an empty email**, as Ali permitted on 2026-10-31 for these imports. Git accepted `Name <>` authors in a scratch test on 2026-10-31. The committer field remains Ali's normal identity, because Ali's checkout performed the import.
  - Aryan original: author `Aryan <>`.
  - Joint package: author `Aryan and Parsa (joint) <>`.
  - Reza original: author `Reza <>`.
- An empty email does **not** link a GitHub account and does not claim one exists. No email, account, date or earlier commit is invented.
- **Integration adaptations and fixes** written for this branch are committed under Ali's configured identity. Commit messages say which original contribution they adapt. Original contributors are not credited with code they did not write.
- **AI assistance:** the integration work in this branch is carried out by Ali with Claude Code (Anthropic) as coding assistant; the 2026-10-31 source audit and plan were prepared with Codex. This is disclosed here and in the README/course documentation, **never** as `Co-Authored-By` trailers or "generated with" lines in Git metadata.
- No history rewrite, no force-push, no merge to `main` in this integration run.

## 3. Planned commit boundaries

| Task | Commit content | Author field |
| --- | --- | --- |
| T00/T02 | Audit/plan documents baseline (`201a006`), this ledger, demo-DB ignore rule | Ali |
| T03 | Aryan V12.2 map files exactly as in `LCC_K1_FOR_ALI_V12_2.zip`, survey templates, QA reports | `Aryan <>` |
| T04 | Joint package `add/` files verbatim, the shared-file edits produced by its own reviewed `apply_to_repo.py` patch function, its map delta over T03 and its map-nav edit, plus its docs | `Aryan and Parsa (joint) <>` |
| T04 (if needed) | Any adaptation required to make the joint patch fit the current tree | Ali |
| T05 | Reza's two source files and documentation verbatim | `Reza <>` |
| T05 | Shared nav/i18n wiring for `/newcomers` | Ali |
| T06+ | Contracts, seed, bug fixes, map integration, admin UI, tests, docs | Ali |

## 4. Import log

Filled in as each import happens (actual SHAs).

| Task | Commit | What entered | Verification |
| --- | --- | --- | --- |
| T00 | `201a006` | Audit/plan baseline docs | Secret pattern scan: no matches |

## 5. Integration adaptations log

Each entry: task, file(s), what changed relative to the imported source, why, author.

| Task | Commit | Adapted source | Change | Author |
| --- | --- | --- | --- | --- |

## 6. Unknowns that stay unknown

- Internal Aryan/Parsa split of the joint package — question for Aryan and Parsa.
- Physical accuracy of the three floor illustrations (described by the submissions as AI-generated illustrations, not verified plans).
- Provenance of the K1-114 entry (the package mentions a campus plan that was not supplied).
- Real newcomer facts, screen measurements and any participant results (none were supplied).
