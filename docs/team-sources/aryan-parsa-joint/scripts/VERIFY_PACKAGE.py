#!/usr/bin/env python3
"""Offline verification of Parsa+Aryan's deliverable based on Aryan V12.2."""
from pathlib import Path
import hashlib, json, re
ROOT=Path(__file__).resolve().parent
M=json.loads((ROOT/'ROOMS_SOURCE_AND_BOOKING.json').read_text())
O=json.loads((ROOT/'ARYAN_ORIGINAL_ROOMS_47.json').read_text())
assert len(O['places'])==47, 'original marker count changed'
C=M['allowed_codes'];assert len(C)==21 and len(set(C))==21
paths=[ROOT/'01_NETLIFY_DEMO',ROOT/'02_FUER_ALI_NEXTJS/ARYAN_MAP/nextjs/public/map-demo']
expected={'1OG': '11db1f215f829cc4796801be71cfa60436e927ec5bf901de8e7b465f7c8d7c5b', '2OG': '67d932dce5297d3869113642b04b28e621673d249c56ae0a09d0cdb6b386c5b1', '3OG': '76bd13c5c9afdecd455f2a592340ce0bed728a3554540c9a172437d0843f7a84'}
for folder in paths:
 N=json.loads((folder/'rooms.json').read_text())
 assert len(N['places'])==48 and N['places'][:47]==O['places']
 assert N['places'][-1]['code']=='K1-114' and N['places'][-1].get('x') is None and N['places'][-1].get('y') is None
 for floor,digest in expected.items():
  h=hashlib.sha256((folder/'assets'/f'{floor}.png').read_bytes()).hexdigest()
  assert h==digest, f'Original floor image changed: {floor} @ {folder}'
 codes=json.loads(re.search(r'window.LCC_BOOKABLE_CODES\s*=\s*(\[.*?\]);', (folder/'room-config.js').read_text(),re.S).group(1))
 assert codes==C, f'map allowlist differs: {folder}'
 assert '<script defer src="room-config.js"></script>' in (folder/'index.html').read_text()
 catalog_file=ROOT/'01_NETLIFY_DEMO/booking/catalog.js'
book=json.loads(re.search(r'window.LCC_BOOKING_CATALOG\s*=\s*(\[.*?\]);',catalog_file.read_text(),re.S).group(1))
assert len(book)==21 and [r['code'] for r in book]==C
catalog={r['code']:r for r in O['places']}
for r in book:
 if r['code']=='K1-114':assert r['mapped'] is False
 else:
  source=catalog[r['code']]
  assert r['name']==source['name'] and r['nameEn']==source['nameEn'] and r['category']==source['category'] and r['floorId']==source['floor']
policy=(ROOT/'02_FUER_ALI_NEXTJS/PARSA_BOOKING/add/src/lib/bookings/policy.ts').read_text()
policy_codes=re.findall(r'"(K1-\d{3})"',policy.split('export const DEMO_BOOKABLE_ROOM_CODES = [',1)[1].split('] as const;',1)[0])
assert policy_codes==C
print('PASS: Source-aligned 47 Aryan rooms, 3 images, 21 booking codes, no fabricated K1-114 location, map/booking/server parity.')
