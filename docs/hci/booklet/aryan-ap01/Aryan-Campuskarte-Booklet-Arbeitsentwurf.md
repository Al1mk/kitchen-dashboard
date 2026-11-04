# Campuskarte Arbeitsentwurf für Aryan

Stand 04.11.2026. Kein freigegebener persönlicher Bericht.

## Seite 1  Campuskarte für den Küchenbildschirm


### Zweck und Status

Dieser Arbeitsentwurf beschreibt Aryans Campuskarte und die anschließende Integration im LCC Campus Board. Er ist als Grundlage für Aryans persönliche Prüfung und Überarbeitung gedacht. Er ist weder eine freigegebene persönliche Erklärung noch ein Nachweis einer durchgeführten Nutzerstudie. Der Text beschreibt ausschließlich die vorhandenen Quellen und die tatsächlich protokollierte technische Prüfung.


### Ausgangslage

Der gemeinsame Prototyp richtet sich an Studierende, Newcomer und Katja als Administratorin. Die Karte unterstützt die Orientierung innerhalb der drei dargestellten Etagen. Studierende sollen einen Raum über seinen Code oder Namen finden und anschließend dessen Stundenplan öffnen können. Für einen freigegebenen Demoraum führt ein weiterer Link zur Buchung. Die öffentliche Oberfläche bietet Deutsch und Englisch. Katja bearbeitet Raumdaten in einer getrennten Verwaltung auf ihrem Laptop.


### Eigener Beitrag und Integrationsarbeit

Aryans ursprüngliche Lieferung enthält drei Planillustrationen, 47 Raumpositionen, Suchfunktionen, Etagenwahl und Zoom. Die frühere gemeinsame Lieferung von Aryan und Parsa ergänzt unter anderem Buchungsverbindungen. Deren interne Aufteilung ist nicht geklärt. Ali hat die eigenständigen Quellen in React mit dem bestehenden Raumverzeichnis und den gemeinsamen APIs verbunden. Die späteren Korrekturen aus der Codeprüfung sind Integrationsarbeit von Ali mit Codex-Unterstützung. Diese Trennung verhindert, dass derselbe Beitrag mehreren Personen als alleinige Entwicklung zugeschrieben wird.


### Rahmenbedingungen

Alis Geräteansicht zeigt ein Elo ET4363L mit 1080 mal 1920 Pixeln, 60 Hertz und einer Drehung um 90 Grad. Bei seinem Anschlussversuch funktionierte die Touch-Eingabe noch nicht. Daraus folgt keine verifizierte Aussage über den Fehler im Gerät oder Treiber. Die erreichbare Höhe und der tatsächliche Browser-Viewport müssen vor Ort geprüft werden.


## Seite 2  Anforderungen und Quellen der Nutzerannahmen


### Annahmen transparent halten

Die Proto-Persona Student möchte den Ort einer Lehrveranstaltung finden. Die Proto-Persona Newcomer kennt Etagen und Anlaufstellen noch nicht. Die Proto-Persona Katja benötigt eine verständliche und verlässliche Bearbeitung der Informationen. Diese Beschreibungen sind zunächst Annahmen aus dem Projektbrief. Sie ersetzen weder Interviews noch die Beobachtung tatsächlicher Nutzung.


### Verfügbare und fehlende Daten

Aryans Paket enthält Vorlagen für eine Befragung und einen Testablauf. Es enthält keine überprüfbaren Rohantworten einer abgeschlossenen Google-Forms-Befragung. Daher nennt dieser Entwurf keine Teilnehmerzahl, keine Prozentwerte und keine angeblichen Zitate. Eine spätere Befragung muss Erhebungsdatum, Rekrutierung und relevante Einschränkungen dokumentieren. Liegt ihr Datum nach einer Designentscheidung, kann sie die vorhandene Gestaltung bewerten, aber nicht rückwirkend deren ursprüngliche Ursache sein.


### Abgeleitete Anforderungen

Eine Raumnummer soll sowohl mit K1-Präfix als auch verkürzt auffindbar sein. Sichtbare Namen stammen aus den aktuellen Raumdaten. Eine Umbenennung darf die Zuordnung zur Position nicht lösen. Nach einem Etagenwechsel im Admin darf die alte Position nicht als aktueller Raumstandort erscheinen. Sprache, Datum und Raumkontext sollen beim Wechsel zum Stundenplan erhalten bleiben. Bei fehlendem Plan oder fehlender Position muss die Raumliste weiterhin nutzbar sein.


### Geplanter Nutzertest

Als Aufgabe ist vorgesehen: Finden Sie K1-120 und öffnen Sie den Stundenplan für morgen. Eine zweite Aufgabe prüft die Auswahl dicht liegender Räume ohne Anleitung. Die Testleitung protokolliert Erfolg, Hilfebedarf und beobachtete Probleme. Zeiten und Fehlerzahlen werden nur berichtet, wenn sie tatsächlich erhoben wurden. Einverständnis und anonymisierte Kennungen gehören zum Testablauf. Diese Aufgaben sind ein Plan und in diesem Entwurf nicht als durchgeführt dargestellt.


## Seite 3  Interaktionskonzept und gemeinsame Daten


### Wiedererkennen statt Erinnern

Die Karte zeigt Raumnummern an den hinterlegten Bildpositionen. Etagenwahl und eine ergänzende Liste bieten alternative Wege zum Ziel. Dadurch muss die Person keine internen Dateinamen oder Koordinaten kennen. Suche, Karte und Liste greifen auf dieselben Raumdatensätze zu. Die Suchauswahl setzt die passende Etage und zeigt die Rauminformationen als Rückmeldung.


### Stabile Identität

Die Zuordnung verwendet room.id statt des bearbeitbaren room.code. Ein Raum kann daher einen neuen Namen oder Code erhalten, ohne eine neue Identität zu bekommen. Das Datenmodell der Karte verbindet eine Raum-ID mit einer Etage und normierten x/y-Werten zwischen 0 und 1. Die Werte beziehen sich auf die jeweilige Illustration. Sie sind keine GPS-Daten und keine vermessenen Gebäudekoordinaten. Wenn die Etage des aktuellen Raumdatensatzes nicht zur hinterlegten Position passt, zeigt das System die alte Markierung nicht.


### Kontext zwischen Seiten

Vom ausgewählten Raum führen Links zum Stundenplan und gegebenenfalls zur Demo-Buchung. Die vorhandenen Routen und APIs bleiben bestehen. Die Sprache folgt dem Parameter lang, der ausgewählte Raum dem Parameter raum und der Tag dem Parameter datum. Die öffentliche Navigation enthält keinen Admin-Link. Die Verwaltung und das Display verwenden trotzdem denselben Datenbestand. Es wurde weder eine zweite Datenbank für die Karte noch eine neue Anwendung eingeführt.


### Kontrolle und verständliche Grenzen

Die Person kann Etage, Zoom oder Suchbegriff ändern und über die gemeinsame Navigation zurückkehren. Für unbekannte oder archivierte Räume erfolgt keine stille Ersatzwahl. Fehlende Bilder und nicht vorhandene Positionen erhalten einen Hinweis und eine nutzbare Liste. Die zugrunde liegenden Bilder sind KI-unterstützte Illustrationen. Auch erkennbare Symbole auf ihnen machen sie nicht zu einem geprüften Gebäude- oder Rettungsplan.


## Seite 4  Verbesserung der Zielauswahl in Version 2


### Beobachtetes Problem

Die technische V1-Prüfung dokumentiert kleine und nahe beieinanderliegende Marker. Als konkretes Beispiel dienen K1-115 und K1-118. Vergrößern allein löst die räumliche Überlagerung nicht. Aryans AP01-Vorschlag fasst solche Ziele zu Gruppen zusammen. Eine Gruppe öffnet eine Liste ihrer Räume. Die Person wählt den gewünschten Raum dort aus. Die gespeicherte Position eines einzelnen Raums bleibt unverändert. Der Mittelpunkt einer Gruppe ist eine Auswahlhilfe und kein neuer Standort.


### Bezug zur Vorlesung

Nach Fitts wird die Auswahl durch Zielgröße und Bewegungsdistanz beeinflusst. Die Nähe zweier benachbarter Ziele ist davon zu unterscheiden: Sie kann hier überlagerte Trefferflächen erzeugen. Gruppenbildung soll diese Mehrdeutigkeit vermeiden. Die sichtbare Auswahl und die Rückmeldung im Detailbereich beziehen sich außerdem auf Sichtbarkeit des Systemzustands. Eine zusätzliche Liste unterstützt Wiedererkennen. Diese Begründungen beschreiben Designabsichten und sind kein gemessener Nachweis einer verbesserten menschlichen Leistung.


### Korrektur der Integrationsfehler

Die erste AP01-Fassung rechnete mit festen Größen von 72 mal 44 und 44 mal 44 CSS-Pixeln. Die vorhandene Kiosk-Gestaltung verwendet rem und vergrößert die Wurzel-Schriftgröße. Bei 22 Pixeln entstehen daher tatsächlich 99 mal 60,5 beziehungsweise 60,5 mal 60,5 Pixel. Die Browserprüfung zeigte trotz bestandener ursprünglicher Tests noch Überlagerungen. Die korrigierte Integration misst die tatsächlichen CSS-Größen und berechnet die Gruppen damit. Weitere Korrekturen betreffen die Rückgabe des Tastaturfokus nach dem Schließen beziehungsweise Auswählen und die Kennzeichnung deutscher Ersatztexte in der englischen Auswahlliste.


### Zuordnung der Arbeit

Gruppierung und Auswahlkonzept stammen aus Aryans AP01-Lieferung. Die Überprüfung gegen die integrierte Kiosk-Gestaltung sowie die darauf folgenden Fehlerkorrekturen und Regressionstests führte Ali mit Codex-Unterstützung aus. Vorher- und Nachher-Nachweise bleiben mit Versionsbezug dokumentiert.


## Seite 5  Evaluation und Grenzen der Aussagen


### Was technische Tests zeigen

Ein Regressionstest wurde zuerst gegen die ursprüngliche AP01-Fassung ausgeführt und schlug an der erwarteten fehlerhaften Stelle fehl. Nach der Korrektur prüft er dieselbe Eigenschaft erneut. Die vier ersten Browserfälle betreffen echte Trefferflächen, Fokus beim Schließen, Fokus nach der Raumauswahl und den Hinweis auf fehlenden englischen Text. Weitere Prüfungen behandeln lebende Raumdaten, Umbenennung und Etagenwechsel. Die vollständigen Ergebnisse und die letzte Prüffassung stehen im beigefügten Evidenzverzeichnis, nicht als unbestätigte Erfolgsaussage in einer Präsentation.


### Was daraus nicht folgt

Automatisierte Browserläufe sind keine 1000 menschlichen Testpersonen. Sie belegen weder Lesbarkeit aus typischer Entfernung noch die Erreichbarkeit des oberen Bildschirmrands. Touch-Emulation prüft keine reale USB-Verbindung und keinen Treiber. Auch eine fehlerfreie Ausführung beweist keine allgemeine Barrierefreiheit. Die bisher bekannten Geräteprobleme, die Genauigkeit der Illustrationen und die noch ausstehende Stage-3-Abnahme bleiben deshalb sichtbar.


### Nächste Erhebung

Nach technischer Integration soll eine kleine tatsächliche Nutzungsprüfung folgen. Studierende und Newcomer führen die vereinbarten Aufgaben ohne Anleitung aus. Für Katja ist ein separater Ablauf mit Entwurf, Vorschau, Veröffentlichung und Kontrolle auf der öffentlichen Anzeige sinnvoll. Der Bericht muss Daten der Durchführung, anonymisierte Beobachtungen und konkrete daraus abgeleitete Änderungen enthalten. Erst ein erneuter Test erlaubt eine Aussage dazu, ob ein beobachtetes Problem für diese Personen seltener auftritt.


### Nachweise und Freigabe

Quellen sind docs/contributions.md, docs/contracts.md, die unveränderten AP01-Quelldateien, der V1-Audit vom 3. November und der aktuelle Reparaturbericht mit Logs. Dieser Text entstand als KI-unterstützter Arbeitsentwurf aus diesen Quellen. Aryan muss seine eigene Rolle, Formulierungen und gegebenenfalls zusätzliche Originalbelege prüfen. Reza kann anschließend die gemeinsame Struktur vereinheitlichen. Aktuelle Moodle-Vorgaben und die endgültige persönliche Einreichung sind vom Team zu bestätigen.
