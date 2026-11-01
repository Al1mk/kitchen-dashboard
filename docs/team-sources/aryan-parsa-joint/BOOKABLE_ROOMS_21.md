# Raumbuchung – 21 Demo-Räume (Parsas aktuelle Auswahl)

**Nur HCI-Demo. Keine amtliche Raumbuchung oder Freigabe durch die Hochschule.**

`K1-103-K1-114` wird als **K1-103 und K1-114** gelesen, nicht als lückenlose Zahlenfolge. Parsa kann das bei Bedarf ändern.

| Code | Name (Katalog) | Etage | Marker in Aryans Karte? |
|---|---|---|---|
| K1-103 | Seminarraum 1 | 1OG | ja |
| K1-114 | Rapid Prototyping | 1OG | nein (nicht verortet) |
| K1-119 | Media Lab | 1OG | ja |
| K1-112 | Maschinenraum | 1OG | ja |
| K1-121 | Elektronik-Werkstatt | 1OG | ja |
| K1-120 | Seminarraum | 1OG | ja |
| K1-125 | Seminarraum | 1OG | ja |
| K1-218 | Projektraum | 2OG | ja |
| K1-217 | Testmethodenlabor | 2OG | ja |
| K1-216 | Modellstadt V2X | 2OG | ja |
| K1-207 | Besprechungsraum | 2OG | ja |
| K1-210 | Seminarraum | 2OG | ja |
| K1-206 | Büro 3 | 2OG | ja |
| K1-204 | Büro 2 | 2OG | ja |
| K1-211 | Büro 1 | 2OG | ja |
| K1-301 | Büro 1 | 3OG | ja |
| K1-302 | Besprechung | 3OG | ja |
| K1-303 | Seminarraum 8 | 3OG | ja |
| K1-307 | Seminarraum 7 | 3OG | ja |
| K1-305 | Büro 2 | 3OG | ja |
| K1-306 | Büro 3 | 3OG | ja |

Der Karte-Datensatz enthält 47 ursprüngliche Marker plus **K1-114** als suchbaren Eintrag **ohne erfundene Kartenkoordinaten**.
Die anderen Räume können auf der Karte angezeigt werden, besitzen aber keinen Demo-Buchungsbutton.

## Technische Verwendung
- Statisches Netlify-Demo: `01_NETLIFY_DEMO/` hochladen. Reservierungen liegen nur im Browser (`localStorage`).
- Next.js-Integration: `02_FUER_ALI_NEXTJS/INSTALL_COMBINED.py` auf einem Feature-Branch mit `--dry-run` prüfen.
- Danach **nur in isolierter Demo-Datenbank**: `node scripts/seed-parsa-demo-rooms.ts` ausführen.
  Das Script ändert niemals `is_demo=0` bestehende reale Raumdatensätze, sondern meldet sie für Ali.
- Anschließend APIs und Zeitkonflikte auf dem echten Repository testen: `npm run typecheck && npm run lint && npm test && npm run build && npm run test:e2e`.

**Achtung:** Der Browser-Prototyp ist nicht die echte SQLite-Integration. Die 21 angekreuzten Räume haben keine verifizierte Reservierungsberechtigung; darunter befinden sich Büros und Labore.

**Server protection:** The React room selector AND the SQLite booking repository enforce the 21-code list in `src/lib/bookings/policy.ts`. Simply having `reservable=true` for another existing demo room does **not** make it bookable in Parsa's booking flow.
