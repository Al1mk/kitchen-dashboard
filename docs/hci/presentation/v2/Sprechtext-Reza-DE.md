# Sprechtext für Reza

Arbeitsfassung vom 04.11.2026 zur fünfteiligen Präsentation. Ziel: etwa fünf Minuten **einschließlich** kurzer Demo. Die Zeitfenster sind geplant, nicht gemessen. Einmal mit Stoppuhr proben und bei Bedarf kürzen. Aussagen über Testteilnehmer oder Touch-Erfolg nur ergänzen, wenn echte Belege vorliegen.

## Folie 1  Problem und Rahmen  0:00 bis 0:35

Unser Projekt ist das LCC Campus Board für den Küchenbereich am Lucas-Cranach-Campus. Studierende sollen dort Räume, Termine und aktuelle Informationen finden. Katja verwaltet die Inhalte von ihrem Laptop aus. Der öffentliche Bildschirm zeigt eine getrennte Oberfläche. Wir entwickeln einen zusammenhängenden Prototyp mit Demo-Daten. Heute zeigen wir den Weg von der ersten integrierten Version zu begründeten Verbesserungen.

## Folie 2  Nutzergruppen  0:35 bis 1:10

Wir unterscheiden drei Rollen. Studierende suchen ihren Raum oder den nächsten Termin. Newcomer benötigen eine verständliche Orientierung im Gebäude und einen Einstieg auf Deutsch oder Englisch. Katja muss Informationen bearbeiten, prüfen und veröffentlichen können. Alle Bereiche nutzen denselben Datenbestand. Die Rollenbeschreibungen sind zunächst Proto-Personas. Wir behaupten damit keine bereits abgeschlossenen Interviews.

## Folie 3  Beiträge und kurze Demo  1:10 bis 2:45

Aryan hat die ursprüngliche Karte mit drei Etagen, 47 Positionen, Suche und Zoom geliefert. Ali hat die gemeinsame Verwaltung, Datenverträge und Integration aufgebaut. Parsa lieferte die V2-Verbesserungen der Buchung. Ich kümmere mich um Newcomer-Inhalte und die Zusammenstellung der Dokumentation. Die interne Aufteilung unserer älteren gemeinsamen Aryan-Parsa-Lieferung bleibt als gemeinsam dokumentiert.

**Demo etwa 60 Sekunden:** Auf der Startseite die Karte öffnen. Nach K1-120 suchen. Den ausgewählten Raum zeigen und „Termine in diesem Raum“ öffnen. Die Raumbuchung über den bestehenden Link zeigen. Nur einen tatsächlich freien Zeitraum wählen. Bestätigen, die Rückmeldung und den Hinweis zum Sichern des Stornocodes zeigen. Den privaten Code nicht auf Folien oder in der Aufnahme offenlegen. Wenn die Demo länger dauert, den letzten Schritt anhand des vorbereiteten Screenshots erklären. Anschließend kurz „Neu am Campus“ und die Sprachumschaltung zeigen.

**Katja in einem Satz oder einem vorbereiteten zweiten Tab:** In der Verwaltung am Laptop speichert Katja einen Entwurf, prüft die Vorschau und veröffentlicht ihn für die öffentliche Anzeige. Admin nicht auf dem gemeinsamen Kiosk anmelden. Kein spontaner Wechsel in die Verwaltung während einer Buchung mit noch nicht gesichertem Beleg.

## Folie 4  Ein konkreter Schritt von V1 zu V2  2:45 bis 4:05

Bei der Karte lagen einige Markierungen sehr dicht beieinander. Größere Schaltflächen allein hätten sich weiter überlagert. Aryans AP01-Konzept fasst nahe Ziele deshalb zu Gruppen zusammen. Eine Gruppe öffnet eine Liste, aus der man einen Raum eindeutig auswählt. Die gespeicherten Raumpositionen bleiben erhalten.

Die erste technische Prüfung fand noch einen Integrationsfehler. Die Berechnung verwendete feste Pixelgrößen, während unsere Kiosk-Oberfläche mit rem skaliert. Ali hat die Berechnung mit Codex-Unterstützung an die tatsächlichen Größen angepasst. Außerdem kehrt der Tastaturfokus nach dem Schließen zurück und die englische Liste kennzeichnet deutsche Ersatztexte. Das knüpft an Fitts, verständliches Feedback und konsistente Bedienung an. Wir können die technische Korrektur belegen. Ob Menschen dadurch schneller und sicherer arbeiten, muss ein Nutzertest zeigen.

## Folie 5  Bewertung und Grenzen  4:05 bis 5:00

Unsere Nachweise sind bisher hauptsächlich technische Tests im Browser. Sie prüfen Funktionen, reale Trefferflächen in mehreren simulierten Größen, Sprachwechsel und Tastaturbedienung. Das ist kein Ersatz für echte Testpersonen. Ali hat beim Anschluss an das Elo ET4363L noch ein Touch-Problem beobachtet. Wir müssen vor Ort die Verbindung, den tatsächlichen Viewport und die Erreichbarkeit prüfen. Stage 3 und die gemeinsame Endabnahme bleiben offen. Danach lassen wir Personen typische Aufgaben ohne Anleitung ausführen und dokumentieren nur tatsächlich beobachtete Ergebnisse. Die Planbilder sind KI-unterstützte Illustrationen und keine geprüften Gebäude- oder Rettungspläne.

## Vorbereitung und Rückfallplan

- Ali: den aktuellen geprüften Commit und eine separate Demo-Datenbank verwenden. Kein Seed auf der echten `data/`-Datei. Server vor Beginn starten.
- Parsa: einen freien Demo-Zeitraum prüfen. Persönliche Buchungsbelege nicht in den Screenshot-Ordner aufnehmen.
- Aryan: Deck in der tatsächlich verwendeten Präsentationssoftware öffnen und alle fünf Seiten prüfen. Noch kein PowerPoint-Test dokumentiert.
- Reza: mit Stoppuhr proben. Bei fehlendem Touch ehrlich mit Maus demonstrieren. Wenn die Live-Demo ausfällt, Folie 4 und die Screenshots verwenden.
- Team: aktuelle Moodle-Termine und Abgabeformat bestätigen. Diese Arbeitsfassung ist keine Einreichung und keine erteilte Freigabe aller vier Personen.
