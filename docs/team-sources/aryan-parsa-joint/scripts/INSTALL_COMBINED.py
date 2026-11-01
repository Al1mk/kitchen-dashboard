#!/usr/bin/env python3
"""Parsa+Aryan HCI Next.js integration, run on a clean feature branch.
No force overwrites, no remote writes. See README_FOR_ALI.md.
"""
import argparse, pathlib, subprocess, sys, shutil
ROOT=pathlib.Path(__file__).resolve().parent

def once(text, before, after, label):
    if before not in text or text.count(before)!=1:
        raise RuntimeError(f"STOP: changed anchor in {label}: {before[:80]!r}")
    return text.replace(before,after,1)

def plan_nav(repo):
    # Booking script must be installed first, then map. Extend its 5-item DE/EN nav
    # so the separate map route is discoverable without linking it to SQLite.
    i18n=repo/'src/lib/i18n/public.ts'; nav=repo/'src/components/public/PublicNav.tsx'
    a=i18n.read_text('utf-8'); b=nav.read_text('utf-8')
    a=once(a,'| "booking";', '| "booking" | "map";', str(i18n))
    a=once(a,'booking: "Raumbuchung" }', 'booking: "Raumbuchung", map: "Karte" }',str(i18n))
    a=once(a,'booking: "Booking" }', 'booking: "Booking", map: "Map" }',str(i18n))
    b=once(b,'  { key: "booking", path: "/booking" },','  { key: "booking", path: "/booking" },\n  { key: "map", path: "/map" },'.replace('\n','\n'),str(nav))
    return {i18n:a,nav:b}

def main():
    p=argparse.ArgumentParser();p.add_argument('repo');p.add_argument('--dry-run',action='store_true'); a=p.parse_args()
    repo=pathlib.Path(a.repo).resolve();
    if not (repo/'package.json').is_file(): sys.exit('STOP: Not a Next.js project directory')
    # No edits to main; Ali must review this feature branch before PR.
    if (repo/'.git').exists() and not a.dry_run:
        branch=subprocess.run(['git','-C',str(repo),'branch','--show-current'],capture_output=True,text=True).stdout.strip()
        if branch in ('main','master'): sys.exit('STOP: Create a separate feature branch first')
    booking=ROOT/'PARSA_BOOKING/apply_to_repo.py'; aryans=ROOT/'ARYAN_MAP/scripts/install_into_repo.py'
    check=subprocess.run([sys.executable,str(booking),str(repo),'--dry-run'])
    if check.returncode: return check.returncode
    if (repo/'src/app/map/page.tsx').exists() or (repo/'public/map-demo').exists():
        print('STOP: Existing map route/assets detected. Ali should compare/merge manually instead of overwriting.', file=sys.stderr);return 1
    # Simulate the booking patch to the navigation/i18n files and verify our
    # final map-nav anchors BEFORE either existing install script changes files.
    import importlib.util
    spec=importlib.util.spec_from_file_location('parsa_apply_guard',booking)
    patch_module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(patch_module)
    try:
        nav_root=repo/'src/components/public/PublicNav.tsx'
        i18n_root=repo/'src/lib/i18n/public.ts'
        nav_future=patch_module.patches('src/components/public/PublicNav.tsx',nav_root.read_text('utf-8'))
        i18n_future=patch_module.patches('src/lib/i18n/public.ts',i18n_root.read_text('utf-8'))
        def safe_once(content,before):
            if content.count(before)!=1: raise RuntimeError(f'Missing or ambiguous final map-nav anchor: {before}')
        for frag in ('| "booking";', 'booking: "Raumbuchung" }', 'booking: "Booking" }'): safe_once(i18n_future,frag)
        safe_once(nav_future,'  { key: "booking", path: "/booking" },')
    except (RuntimeError,OSError) as exc:
        print(f'STOP: {exc}. No files written.',file=sys.stderr);return 1
    if a.dry_run:
        print('DRY RUN OK: booking, map paths and final navigation anchors checked; no files written.');return 0
    result=subprocess.run([sys.executable,str(booking),str(repo)])
    if result.returncode: return result.returncode
    result=subprocess.run([sys.executable,str(aryans),str(repo)])
    if result.returncode: return result.returncode
    try:
        edits=plan_nav(repo)
        for path,text in edits.items():path.write_text(text,'utf-8')
    except RuntimeError as e:
        print(str(e),file=sys.stderr);return 1
    print('COMPLETE: /map linked to /booking by room code. Next: run typecheck, lint, tests, build, e2e; review git diff.')
    return 0
if __name__=='__main__':sys.exit(main())
