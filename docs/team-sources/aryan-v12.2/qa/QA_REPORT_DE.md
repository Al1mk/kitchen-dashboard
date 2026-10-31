# HCI — LCC Navigator V12.2: QA-Bericht und Übergabestatus

Stand 30.10.2026, geprüft auf Grundlage der bereitgestellten V12.1-Pakete.

## Korrekturen gegenüber V12.1
- Verständliche Fehlermeldung statt JavaScript-Abbruch, wenn `data.js` nicht verfügbar ist.
- Bei fehlendem Kartenbild wird ein Hinweis angezeigt; die Marker auf der leeren Bildfläche werden ausgeblendet.
- Erweiterte unsichtbare Touch-Flächen für die roten Raumnummern; Zoom, Sprache und Suchfeld-Löschen sind leichter anzutippen.
- Korrekte Screenreader-Beschriftungen bei Sprachwechsel; interaktive Ergebnisbuttons behalten ihre native Button-Semantik.
- Sichere, eindeutig benannte Backups bestehender `/map`-Seiten im Installationsskript.

## Durchgeführte Prüfungen
**218 erfolgreiche Browserprüfungen** mit Chromium: alle 47 Raumcodes, Zuordnung und Sichtbarkeit der ausgewählten Marker, Textsuche, Formatfehler und Korrektur, DE/EN, Geschosswechsel, Zoom, Marker-Toggle und sechs Viewport-Größen (320 bis 1920 px). **23 weitere Prüfungen**: Daten-Datei fehlt, Touch-Bedienung und lokalisierte Accessibility-Labels. Zusätzliche Prüfung bei Bildladefehler erfolgreich. JavaScript-Syntax, 47 eindeutige Raumcodes, Koordinaten, PNG-Abmessungen, Paketstruktur und Installationsskript geprüft.

## Nicht geprüft / Grenzen
- Browserprüfungen mussten aufgrund der Sandbox-Navigationseinschränkungen auf einer lokal eingebetteten Version erfolgen, nicht auf der live veröffentlichten Netlify-Site.
- Kein vollständiger Next.js-Build des echten Ali-Repositories. `/map` leitet auf die unabhängige Demo unter `/map-demo/index.html` weiter; SQLite, Stundenplan und Buchungen sind nicht angebunden.
- AI-generierte Illustrationen sind keine amtlichen oder verifizierten Grundrisse; die Sicherheitsgrafik **ersetzt keine Flucht- und Rettungspläne**.
- Usability-Umfrage und Ergebnisse sind vorbereitet, aber ohne tatsächliche Teilnehmer nicht abgeschlossen.

## Übernahme
Im eigenen Branch die Dateien mit `python3 scripts/install_into_repo.py /PFAD/ZU/kitchen-dashboard` integrieren. Anschließend Tests, Lint und Build **im echten Repository** durchführen. Die inhaltliche Freigabe der Darstellung liegt beim verantwortlichen Teammitglied Aryan Nourmohammadi; die technische Integration erfolgt separat.
