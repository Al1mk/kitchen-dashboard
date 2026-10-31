# Qualitäts- und Provenienznachweis: Parsa + Aryan (30.10.2026)

## Von der echten Quelldatei überprüft
- Eingabe: `LCC_K1_COMPLETE_V12_2_QA_VERIFIED.zip` / Nested `LCC_K1_STUDENT_DEMO_V12_2_NETLIFY.zip`.
- Aryans Originaldatensatz `rooms.json`: **47** Raum-/Bereichsobjekte. Alle 47 wurden Feld für Feld inklusive Marker-Koordinaten auf unveränderte Übernahme geprüft. Die drei `assets/*.png` wurden bitweise mit der Quelldatei verglichen.
- Parsas Auswahl: **21** Demo-Codes, davon **20 in Aryans Originalkatalog**. `K1-114` wird als neuer Eintrag ohne erfundene Koordinaten ergänzt (Namensangabe aus separat bereitgestelltem Hochschulplan).
- Die Allowlist für Kartenschaltfläche, Browser-Buchung und Next.js-API-Policy ist identisch. Andere Räumen haben keinen Demo-Buchungsbutton.

## Eigene ausgeführte Prüfungen
- `node --check` für Karte-/Browser-Scripts und `python -m py_compile` für Integrationsskripte.
- Chromium über Playwright mit **eingebetteten lokalen HTML-, JS- und CSS-Texten** (da Netz-/Dateinavigation in dieser Toolumgebung blockiert war): alle 47 Quellcodes suchbar, Zuordnung von Buchungsbuttons (nur Codes aus der Liste), K1-114 ohne Marker, 21 Einträge und Etagenfilter im Buchungsbildschirm, DE/EN-Umschaltung, Auswahl, Erzeugung einer simulierten Buchung und anschließende Stornierung mit Code.
- Der kombinierte Installer wurde mit Dry-Run und vollständiger Installation auf einem **synthetischen** Repo mit den erwarteten Textankern erprobt. Es erfolgte **kein** Eingriff in das reale GitHub-Repo und kein echter Next.js-Build.

## Noch NICHT nachgewiesen
- Kein direkter Test des echten Ali-Checkouts mit Next.js/SQLite/Playwright-E2E; Ali muss die Pakete auf einem Feature-Branch integrieren und `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e` ausführen.
- Keine Verbindung zu offiziellen Raumfreigaben oder tatsächlichen Stundenplan-/Buchungsdaten. Darunter sind Büros und Laborräume nur hypothetisch buchbar.
- Keine durchgeführten echten Nutzerstudien; keine erfundenen V1/V2-Ergebnisse.
- Keine Freigabe der KI-generierten Bildillustrationen als offizieller Gebäude- oder Fluchtplan. Vor öffentlicher Weitergabe im Team abstimmen.

## Bedienweg
Karte `/index.html` (47 Original-Marker + `K1-114` ohne Position) → Room-CTA (nur 21 hypothetische Räume) → `booking/index.html?raum=K1-120&lang=de` (autoselektiert) → Zeitraum → Prüfung → lokale Demo-Reservierung → Stornierung. Die React/SQLite-Variante nutzt `/map` und `/booking` auf Alis Seite; die Weitergabe erfolgt per Raumcode, Speicherung per stabiler Raum-ID.
