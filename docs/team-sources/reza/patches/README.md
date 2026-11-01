# Integration patches — review before applying

These are small targeted patch suggestions against the public main-branch shape reviewed on 2026-10-29. They are **not applied to GitHub**. Confirm with Ali before touching shared files.

Apply after adding:
- `src/app/newcomers/page.tsx`
- `src/lib/newcomers/content.ts`

Then manually apply/review:
1. `01-public-section-i18n.patch` — adds the new `PublicSection` key and DE/EN navigation labels.
2. `02-public-nav.patch` — adds `/newcomers` to the shared public navigation.

After applying, inspect current file contents because team changes may have landed since the reviewed snapshot. Check the type union and both `PUBLIC_TEXT` sections remain synchronized. If the live repo differs, adapt the patch rather than forcing it.

Potential further improvement: Add a newcomers tile to the public start page only if Ali agrees. The route itself will be reachable through `PublicNav` once the patches are accepted.
