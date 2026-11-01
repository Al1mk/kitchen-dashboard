# Parsa – Raumbuchung: Aktualisierung nach Aryans V12.2

**Stand:** 30.10.2026 · **HCI-Prototyp, kein offizielles Hochschul-Buchungssystem**

## Problem und Nutzerziel
Studierende am Lucas-Cranach-Campus sollen in der Demonstration einen Raum über das interaktive K1-Gebäudemodell finden und einen freien Zeitraum für ein hypothetisches Treffen auswählen können. Damit werden zwei zuvor getrennte Nutzungswege verbunden: Orientierung im Gebäude (Aryan) und Zeit-/Raumauswahl (Parsa). Weder der Katalog noch die Demo-Buchungen begründen einen Anspruch auf reale Raumnutzung.

## Ausgangsdaten und Quellen
Primärquelle ist das Team-Archiv `LCC_K1_COMPLETE_V12_2_QA_VERIFIED.zip`, darin `LCC_K1_STUDENT_DEMO_V12_2_NETLIFY.zip` mit `rooms.json`, `data.js`, `app.js`, `styles.css` und den Dateien `assets/1OG.png`, `assets/2OG.png`, `assets/3OG.png` von Aryan. Die drei Bilder sind laut Aryans Dokumentation KI-generierte Illustrationen und keine verifizierten Hochschulgrundrisse. Das Original enthält 47 kartierte Bereiche: 21 auf 1OG, 18 auf 2OG und 8 auf 3OG. Die ursprünglichen 47 Datenobjekte und drei Bilddateien bleiben in der neuen Variante unverändert.

Parsa hat 21 Kennungen als **hypothetisch buchbar** ausgewählt, darunter Büro- und Laborräume. Für 20 stehen Raumname, Raumtyp, Etage und Positionsmarkierung in Aryans `rooms.json`. Der zusätzliche Raum `K1-114 – Rapid Prototyping` wurde aus einem separat vom Studierenden bereitgestellten Gebäudeplan übernommen. Aryans V12.2 enthält dazu **keinen Marker**, daher wurde keine Position hinzuerfunden. Die Zeichenfolge `K1-103-K1-114` wurde als zwei Einzelräume und **nicht** als Zahlenbereich ausgelegt.

## Zwei konkurrierende Sketch-Konzepte
- **A – Raum zuerst:** Nach Auswahl oder Suche auf Aryans Karte wird ein vorausgewählter Raum an die Reservierung übergeben. Danach wählt die Person Datum, Dauer und eine freie Startzeit. Das entspricht dem hier implementierten Weg und reduziert erneute Eingaben.
- **B – Zeit zuerst:** Eine Person wählt erst Datum und Uhrzeit und erhält danach alle passenden Räume. Der Ansatz bleibt als alternative Gestaltungsidee erhalten; eine Usability-Entscheidung zwischen den Wegen ist noch offen.

## Prototyp und Integration
Der öffentliche Demoweg lautet: `Karte → Raum anklicken → „Demo reservieren“ → /booking?raum=K1-120&lang=de → freien Slot wählen → prüfen → bestätigen`. Die Rücknavigation bewahrt Raumnummer und Sprache. Raumkennungen bleiben als lesbare Strings in der Verlinkung; innerhalb der Next.js-/SQLite-Implementierung wird das stabile `rooms.id` für Buchungen verwendet. Die Auswahl wird gegen eine Liste von genau 21 Codes geprüft. Andere der 47 kartierten Räume behalten ihre Navigationsfunktion, erhalten aber keinen Buchungsbutton. Für `K1-114` bleibt die fehlende Kartenposition sichtbar benannt.

Die statische Netlify-Demo speichert hypothetische Reservierungen ausschließlich im jeweiligen Browser mittels `localStorage`. Ihre Konfliktprüfung und Stornierung können interaktiv erprobt werden, sind aber **keine echte Multiuser-Backend-Funktion**. Das separate Next.js-Modul verwendet SQLite, serverseitige Prüfungen und Kollisionserkennung mit Lehrveranstaltungen. Dessen vollständig integrierte Ausführung im tatsächlichen Repository muss Ali noch prüfen.

## Mensch-Maschine-Interaktion / Begründung
- **Mapping und Konsistenz:** identische Kennung `K1-120` auf Karte, Buchungsseite und Beleg; gleiche Farben, Schriften und Benennungen wie Aryans V12.2.
- **Fitts’ Law:** größere Touchflächen für Raumauswahl, Etagenfilter und Zeitfenster; die Eignung am physischen Hochformat-Display bleibt zu untersuchen.
- **Visibility of system status:** aktive Etage, gewählter Raum und belegte/freie Zeiten erhalten unterscheidbare Zustände. Eine Zusammenfassung erscheint vor der Bestätigung.
- **Error prevention:** nicht verfügbare Zeitfenster sind deaktiviert; Doppelbuchungen werden in der Browser-Demo lokal und in der Next.js-Variante auf dem Server geprüft.
- **Feedback und Recovery:** Erfolgsmeldung, Buchungsnummer und Stornierungscode; Löschung der Quittungsansicht nach 60 Sekunden ist eine *vorläufige* Privatsphäre-Entscheidung und muss mit Reza getestet werden.
- **Zweisprachigkeit:** der Besucher kann zwischen Deutsch und Englisch wechseln; die ausgewählte Raumnummer bleibt erhalten.

## Noch offene wissenschaftliche Nachweise
Für das Booklet müssen echte Nutzungstests, Teilnehmendenzahl, Aufgabenstellungen, Beobachtungen, Fotos/Screenshots des V1-Prototyps, begründete Anpassungen in V2 und deren Wirkung nachgetragen werden. Nicht vorhanden sind offizielle Reservierungsfreigaben, reale Belegungsdaten, eine offizielle Gebäudekarte und der dokumentierte vollständige Next.js-Build in Alis realem Checkout. Diese Punkte dürfen nicht als erledigt dargestellt werden.

## Empfohlene Usability-Aufgaben
1. „Finde K1-120 auf der Karte und reserviere in der Demo morgen einen freien 60-Minuten-Slot.“
2. „Wechsle auf Englisch und finde den Raum K1-303 im 3. Obergeschoss.“
3. „Versuche einen bereits gebuchten Zeitraum nochmals zu reservieren. Was passiert?“
4. „Storniere die Demo-Reservierung mit dem angezeigten Code.“
5. „Finde K1-114 und beschreibe, was die fehlende Position auf der Karte bedeutet.“

**Protokollvorlage:** Teilnehmercode (keine Klarnamen) · Gerät · Aufgabe · geschafft ja/nein · Fehlklicks / Suchdauer (tatsächlich gemessen) · beobachtetes Problem · Änderung V1→V2. Keine fiktiven Ergebnisse.
