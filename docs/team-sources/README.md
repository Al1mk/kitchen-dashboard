# Team source documents (imported unchanged)

These folders hold the teammates' delivered documents and scripts exactly as supplied (see `docs/contributions.md` for hashes, commits and attribution). They are **historical source material**, not the current description of the app. Do not edit them; corrections go into the current docs.

Known differences between these originals and the integrated branch (2026-10-31):

| Original statement | Current state |
| --- | --- |
| Some booking texts mention **four** bookable rooms | The joint package's own code/manifest used 21 codes. In the integrated app, bookability is the admin's `reservable` flag; the 21 codes are only the team demo seed's starting values. |
| A 21-code **allowlist** is enforced in client and server | Removed at runtime (room codes are editable, not permissions; audit A-05). |
| `/map` redirects to `/map-demo/index.html` with `?raum=<code>` | `/map` is an in-app page using room **ids**; `/map-demo/` remains only as provenance of Aryan's original. |
| `VERIFY_PACKAGE.py` checks `01_NETLIFY_DEMO/` and `02_FUER_ALI_NEXTJS/` | Those folders were not part of the source delivery; the verifier cannot pass here and is not used. |
| `INSTALL_COMBINED.py` / `apply_to_repo.py` install the modules | Used once, after review, for the joint import (`1c566f3`); not to be run again on this branch. |
| QA reports (218 + 23 assertions) | Reported by the supplier; not re-run here. The integrated app has its own tests. |
| Reza's drafts mark measurements/participants as NOT RUN | Still true: no screen measurement or participant study has been done. |
