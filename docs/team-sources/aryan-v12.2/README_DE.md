# Aryans LCC Navigator – V12.2 (QA- und Touch-Hotfix): Sofortige Eingabehilfe bei fehlerhaften Raumnummern

## Was ist neu?
Bei einer fehlerhaften Raumnummer erscheint **direkt unter der Suche** eine rote, verständliche Fehlermeldung mit Beispielen für korrekte Eingaben. Der Fehler wird nach **480 ms Tipp-Pause** gemeldet (oder sofort beim Verlassen des Feldes bzw. Absenden). Er verschwindet unmittelbar nach einer Korrektur. Das Feld bekommt zusätzlich `aria-invalid="true"`; die Meldung hat `role="status"` und `aria-live="polite"` und bleibt somit nicht allein von der Farbe abhängig.

**Gültig:** `K1-120`, `K1 120`, `120`, `K1-215a`, `215b` sowie freie Raumnamen wie `Seminarraum`. Groß-/Kleinschreibung spielt keine Rolle. **Ungültig:** `K1-12`, `K1-12x`, `K1120`, `K2-120`, `K-120`. Unvollständige Eingaben werden erst nach kurzer Tipp-Pause kritisiert, nicht bei jedem Tastenanschlag. Bei ungültiger Nummer startet Enter keine falsche Raumnavigation.

## Technische Integration in Alis Projekt
1. Eigenen Git-Branch in `Al1mk/kitchen-dashboard` verwenden, bestehende Arbeiten der anderen nicht überschreiben.
2. Aus diesem ZIP ausführen: `python3 scripts/install_into_repo.py /PFAD/ZU/kitchen-dashboard`.
3. Auf `/map` oder `/map-demo/index.html` das neue Suchverhalten testen.
4. Fehler testen (`K1-12x` → roter Hinweis), korrigieren (`K1-120` → Hinweis verschwindet, Raum markiert), Sprachumschaltung DE/EN, freie Raumnamen, mobilen Viewport.
5. `npm run lint`, `npm run build` und die bestehenden Projekttests lokal ausführen. Diese repository-weiten Schritte wurden hier **nicht** ausgeführt.

Geänderte Browserdateien im Vergleich zu V11: `index.html`, `app.js`, `styles.css`. Bestehende Planbilder und 47 Raum-Marker bleiben unverändert. Kein Eingriff in SQLite, Buchungen, Stundenplan-API oder Raummodell.

**Rechtlicher/sachlicher Hinweis:** Die verwendeten Grundriss-Bilder sind KI-generierte, vom Team ausgewählte Entwurfsillustrationen, **keine geprüften offiziellen Gebäudepläne**. Der Prototyp stellt weder amtliche Wegführung noch Echtzeit-Belegung dar.

HCI-Beitrag: Aryan Nourmohammadi.

## Zusätzliche QA-Korrekturen V12.1
- Die existierenden Raumcodes `K1-215a` und `K1-215b` werden nicht mehr fälschlich als ungültiges Format abgelehnt. Auch `215a` / `215b` funktionieren.
- Nach manueller Etagenwahl wird die vorherige Raumsuche gelöscht, damit die neue Etage ihre Marker zeigt.
- Die vorhandenen 47 Kartenmarker und drei Bilddateien bleiben unverändert.

## QA-Nachtrag V12.2
- Eine fehlende `data.js`-Datei führt nicht mehr zu einem ungefangenen JavaScript-Fehler; ein sichtbarer Datenhinweis wird angezeigt.
- Interaktive Raumetiketten besitzen unsichtbar vergrößerte Klick-/Touchbereiche (ohne die roten Nummern optisch zu vergrößern).
- Suchfeld-Löschtaste, Sprachumschaltung und Zoomtasten haben größere Touchziele für den Kiosk-Einsatz.
- Backups der bestehenden `/map`-Route erhalten einen Mikrosekunden-Zeitstempel, damit wiederholte Installationen bestehende Backups nicht überschreiben.
- Kartenbilder und alle 47 Raumcodes/-koordinaten bleiben identisch mit V12.1.
- Browser-Audit erfolgt mit lokal eingebetteten Dateien, weil diese Laufzeitumgebung Navigation zu `file://` und `localhost` blockiert. Daher ist dies **keine** bestätigte Live-Netlify-Prüfung und **kein** erfolgreicher Next.js-Build im echten Repo.
