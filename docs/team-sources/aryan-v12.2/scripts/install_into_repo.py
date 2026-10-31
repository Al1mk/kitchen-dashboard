#!/usr/bin/env python3
"""Safe, idempotent integration of Aryan's independent map into Ali's Next.js repository.

Usage: python path/to/install_into_repo.py path/to/kitchen-dashboard
Does not edit SQLite, floor enum, schedules, booking, or anyone's existing modules.
"""
from pathlib import Path
import sys, shutil, datetime, filecmp

def main():
    if len(sys.argv) != 2:
        raise SystemExit('Usage: python install_into_repo.py /path/to/kitchen-dashboard')
    repo=Path(sys.argv[1]).expanduser().resolve()
    root=Path(__file__).resolve().parents[1] / 'nextjs'
    source=root/'public'/'map-demo'
    if not (repo/'package.json').is_file() or not (repo/'src'/'app'/'page.tsx').is_file():
        raise SystemExit('ERROR: This does not look like Ali\'s Next.js repository. No files changed.')
    target=repo/'public'/'map-demo'
    # Do not alter another team's work silently.
    if target.exists():
        # Identical reinstall should be a no-op for map-demo, not spawn backups.
        src_files={str(p.relative_to(source)):p for p in source.rglob('*') if p.is_file()}
        old_files={str(p.relative_to(target)):p for p in target.rglob('*') if p.is_file()}
        same=set(src_files)==set(old_files) and all(filecmp.cmp(src_files[k], old_files[k], shallow=False) for k in src_files)
        if same:
            print('Map demo already current; no backup or recopy needed.')
        else:
            stamp=datetime.datetime.now().strftime('%Y%m%d_%H%M%S_%f')
            backup=repo/'public'/f'map-demo-backup-{stamp}'
            shutil.move(str(target),str(backup))
            print('Previous map demo backed up to:',backup)
            shutil.copytree(source,target)
    else:
        shutil.copytree(source,target)
    route=repo/'src'/'app'/'map'/'page.tsx'
    route.parent.mkdir(parents=True,exist_ok=True)
    if route.exists() and route.read_bytes() != (root/'src'/'app'/'map'/'page.tsx').read_bytes():
        stamp=datetime.datetime.now().strftime('%Y%m%d_%H%M%S_%f')
        backup=route.with_name(f'page.tsx.backup-{stamp}')
        shutil.copy2(route,backup)
        print('Previous /map page backed up to:',backup)
    shutil.copy2(root/'src'/'app'/'map'/'page.tsx',route)
    # The integration link is added after the Tiles <ul> instead of extending the
    # typed navigation keys and potentially breaking other people's translations.
    home=repo/'src'/'app'/'page.tsx'
    contents=home.read_text(encoding='utf-8')
    sentinel='data-aryan-map-link'
    if sentinel not in contents:
        needle='      </ul>\n'
        if needle in contents:
            insertion='''      <div data-aryan-map-link="true" className="mt-4">
        <Link href={publicHref("/map", lang)} className="flex min-h-20 items-center rounded-xl border border-brand bg-surface px-6 py-4 font-bold shadow-sm hover:bg-neutral-soft">
          {lang === "en" ? "Interactive building map" : "Interaktive Gebäude-Karte"} →
        </Link>
      </div>
'''
            home.write_text(contents.replace(needle,needle+insertion,1),encoding='utf-8')
        else:
            print('NOTE: Home page differs; please add a /map link by hand. No homepage changes made.')
    print('Installed map into:',repo)
    print('Open Next route: /map  |  Public: /map-demo/index.html')
    print('Run npm test/lint/build for repository-wide validation.')
if __name__=='__main__':
    main()
