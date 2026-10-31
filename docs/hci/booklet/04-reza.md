# Reza — Newcomer Guide und Prüfung des Campus-Displays

**Arbeitsstand:** 29.10.2026. Diese Fassung trennt vorbereitete Entwurfsarbeit von noch zu erhebender Evidenz. Keine realen Displaydaten, Interviews, Teamfreigaben oder Testergebnisse werden erfunden.

## Seite 1 — Nutzerproblem und Zielgruppe

Der LCC Campus Board ist ein studentischer HCI-Prototyp für den vertikal montierten Informationsbildschirm im Küchenbereich des Lucas-Cranach-Campus. Mein Teilbereich ist die Orientierung für Personen, die zum ersten Mal an den Campus kommen. Die Seite `/newcomers` soll eine kurze, aufgabenorientierte Startstelle bieten und zu vorhandenen Informationsseiten führen.

**Kernaufgabe:** „Ich bin neu am Campus und möchte herausfinden, wo ich Informationen zu Räumen und zum Stundenplan finde.“

Primäre Zielgruppen sind neue Studierende, internationale Studierende und Gäste. Diese Gruppen sind vorläufige Proto-Personas bzw. Arbeitshypothesen, keine Ergebnisse einer abgeschlossenen Nutzerstudie. Die Annahmen müssen mit freiwilligen Gesprächen oder einem realen Nutzertest überprüft werden.

Anforderungen: Deutsch und Englisch, kurze verständliche Formulierungen, sichtbare Handlungen, klare Touch-Flächen, keine erfundenen Kontakte/Öffnungszeiten/Raumdaten und deutliche Kennzeichnung von Demo-Inhalten. Der MVP verwendet statische Karten statt einer neuen Datenbank, API oder eines Admin-CMS.

## Seite 2 — Nutzungskontext und Displayprüfung

Laut Projektbeschreibung befindet sich das Display im Küchenbereich und ist im Hochformat montiert. Der konkrete Gerätestand ist zu prüfen. Eine beispielhafte Portrait-Auflösung aus dem Repository ist kein Nachweis für die native Auflösung des physischen Displays.

Zu erfassen sind Hersteller/Modell, physische Maße, native Auflösung, Betriebssystem/Browser, Touch-Technologie, Montagehöhe, Betrachtungsabstand, Umgebungslicht/Spiegelungen und Netzwerkzugang. Alle Angaben werden als `Measured`, `Observed`, `Reported by staff`, `Assumed` oder `Not verified` gekennzeichnet. Die reale Prüfung ist noch offen; es werden keine echten Maße behauptet.

Für die Prüfung wird vorab die zuständige Person um Erlaubnis gebeten. Fotos werden nur mit Erlaubnis und ohne identifizierende Personen oder sensible Daten aufgenommen. Ein Laptop im Hochformat gilt nur als simulierte Portraitansicht und ersetzt keinen Test am echten Kiosk.

## Seite 3 — Entwurfsalternativen

**Alternative A — aufgabenorientierte Karten:** „Räume finden“, „Stundenplan ansehen“, „Aktuelle Hinweise“ und „Du brauchst Hilfe?“ sind direkt sichtbar. Nutzer wählen eine konkrete Handlung, ohne zuerst eine Kategorie verstehen zu müssen.

**Alternative B — kategorienorientierte Navigation:** Inhalte werden Kategorien wie „Studium“, „Gebäude“, „Information“ und „Kontakt“ zugeordnet. Das skaliert bei vielen Inhalten, erfordert aber zusätzliche Interpretation und könnte die globale Navigation duplizieren.

Für den MVP wird Alternative A bevorzugt. Die wichtigsten Aufgaben sind unmittelbar sichtbar, die Auswahl bleibt übersichtlich und die Handlungslabels sind konkret. Das unterstützt `Recognition rather than Recall`. Wenige Hauptoptionen reduzieren kognitive Belastung; Textlabels vermeiden reine Farbcodierung; getrennte Touch-Flächen erleichtern die Bedienung; ein sichtbarer Demo-Hinweis trennt Beispielinformationen von offiziellen Angaben.

Das beigelegte Mockup ist eine Konzeptdarstellung und kein Screenshot des echten Hochschul-Displays.

## Seite 4 — Implementierung und HCI-Prinzipien

Der Integrationsentwurf besteht aus der Route `/newcomers` und einer Datei mit festen deutschen und englischen Karten. Die bestehende Next.js-Anwendung soll ihre gemeinsame `PublicShell`, Sprachlogik und Navigation wiederverwenden. Neue API-Endpunkte, Tabellen oder ein CMS sind für den ersten Prototyp nicht erforderlich.

Berücksichtigte Prinzipien:
- **Konsistenz:** gemeinsame öffentliche Navigation und Sprachwahl wiederverwenden.
- **Feedback/Transparenz:** klarer Hinweis, dass es ein studentischer Prototyp ist.
- **Fehlervermeidung:** keine Karten-Route verlinken, bevor sie vorhanden und geprüft ist.
- **Accessibility:** Inhalte nicht allein durch Farbe vermitteln; Text und sichtbarer Fokuszustand.
- **Touch-Ergonomie:** Aktionsflächen groß und klar getrennt gestalten; endgültige Maße am echten Display überprüfen.

Die HTML-Demo simuliert Interaktionen, ist aber noch nicht mit der Campus-Datenbank, der echten Karte oder offiziellen Daten verbunden. Auf den gemeinsamen GitHub-Working-Tree konnte in dieser Arbeitsumgebung nicht zugegriffen werden; Build, Typecheck, Lint, Regression und Review durch Ali sind noch offen.

## Seite 5 — Evaluation, Grenzen und KI-Nutzung

Geplanter Test: Eine freiwillige Testperson erhält ohne Klickanleitung die Aufgabe: „Du bist neu am Campus und möchtest herausfinden, wo du Informationen zu Räumen und zum Stundenplan findest. Zeig mir bitte, wie du vorgehen würdest.“ Beobachtet werden Einstieg, Verständnis der Beschriftungen, benötigte Hilfe und der Umgang mit dem Demo-Hinweis.

Zu erfassen sind Datum, Version/Commit, getestetes Gerät, selbstständiger/teilweise erfolgreicher/nicht abgeschlossener Aufgabenerfolg, konkrete Beobachtungen, mögliche Fehlinterpretationen und eine aus der Beobachtung abgeleitete Änderung mit erneutem Test (`V1 → Beobachtung → V2 → Retest`). Daten werden anonym dokumentiert. **Der menschliche Nutzertest wurde bis zum Arbeitsstand dieses Dokuments nicht durchgeführt.** Der reale Bildschirm ist nicht verifiziert. Teamfreigabe N1 ist ausstehend.

**Einsatz von KI:** ChatGPT wurde zur Strukturierung, für den bilingualen Textentwurf, den Codeentwurf und die Formulierung dieser Dokumentation verwendet. Übernommene Inhalte müssen von Reza auf Richtigkeit, Projektkompatibilität und Verständlichkeit geprüft werden. Technische Messungen, Teamfreigaben, Nutzerbeobachtungen und Testergebnisse wurden nicht durch KI erfunden.
