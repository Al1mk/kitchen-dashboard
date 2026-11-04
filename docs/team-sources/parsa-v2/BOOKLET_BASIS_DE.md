# Parsa – HCI-Belege für V2 (Arbeitsnotiz, noch kein fertiger Booklet-Text)

**Parsas Ausgangstext: 03.11.2026; Ali/Codex-Redaktionskorrektur: 04.11.2026.** Dieses Dokument trennt Fotos, Designentscheidungen und noch nicht durchgeführte Prüfungen.

| Thema | Dokumentierter Ausgangspunkt | Entwurfsentscheidung für V2 | HCI-Bezug | Belegstatus |
| --- | --- | --- | --- | --- |
| AP-02 Stornierungsdaten | Im aktuellen Quellcode ist der Beleg nur 60 s sichtbar; ein erneutes Abrufen des Codes ist nicht vorgesehen | Bestätigungs-Checkbox vor „Fertig“; Warnung bei Link-Navigation; Sprache kann weiterhin gewechselt werden; Code bei Stornierung gezielt anzeigen/verbergen | Error Prevention; User Control and Freedom; Visibility; Privacy am öffentlichen Kiosk | Technisch entworfene Änderung; auf realer Anlage noch nicht getestet |
| AP-03 Buchungsbestätigung | Die Buchungsübersicht erscheint nach einer langen Auswahlstrecke; der Beleg ersetzt die Formularansicht | Übersicht und Beleg nach Statuswechsel in den sichtbaren Bereich scrollen | Visibility of System Status; Feedback; Cognitive Load | Code-Änderung vorbereitet; Screenshot V2 fehlt |
| AP-03 Stundenplan | Quellcode des integrierten V1-Stundenplans enthält keine direkte Buchungsaktion. Die mitgelieferte Datei `04_schedule_k1-120_2026-11-02.jpeg` zeigt tatsächlich die Karte ohne ausgewählten Raum, keinen Stundenplan | Bei buchbarem Raum und gültigem Datum den Link „Diesen Raum reservieren (Demo)“ anbieten; Raum-ID, Tag und Sprache beibehalten | Consistency; Recognition rather than Recall; weniger Navigationsschritte | Quellcodebefund; das falsch benannte Foto ist kein Stundenplanbeleg. Technische Integrationsprüfung siehe aktuelle Evidence, physischer Retest offen |
| AP-03 ungültiger Raum | V1-Buchung: kein stiller Wechsel auf einen anderen Raum. Der separate Stundenplan zeigte bei einem unbekannten Raum noch einen allgemeinen Verbindungsfehler | Buchungsverhalten beibehalten; im Stundenplan einen nicht verfügbaren Raum von einem Verbindungsfehler unterscheiden und Rückweg anbieten | Error Prevention; Mental Model; Feedback | Bestehende Tests im Ali-Repo vorhanden; V2-Lauf ausstehend |
| AP-04 Textdichte | Längere Demo- und Warntexte im Buchungsbereich | Kürzere DE/EN-Texte; wichtige Sicherheits-, Fehler- und Stornierungshinweise bleiben erhalten | Cognitive Load; Consistency; Accessibility | Sprachdateiänderung vorbereitet; Nutzerbewertung offen |

## Zusammenarbeit und Urheberschaft

- **Parsa:** Fokus Raumbuchungs-Interaktion; AP-02/03 als verantwortliche V2-Aufgaben im Teamplan; Konzeption und Einbringung des Patch-Vorschlags sowie fachliche Dokumentation.
- **Aryan:** Campus-Karte und ursprüngliches Such-/Markierungskonzept; mit Parsa gemeinsame frühere Lieferung (interne genaue Codeaufteilung nicht vollständig nachgewiesen).
- **Ali:** bestehendes Backend, Datenbank, API-Integration, atomare Konfliktprüfung, Request-Retry und die bisherigen V1-Korrekturen. Übernahme und endgültige Prüfung des neuen V2-Patches muss noch erfolgen.
- **Reza:** Newcomers-Inhalte und gemeinsame Dokumentationskoordination.

## Was wir nicht behaupten

- Keine echten Reservierungsberechtigungen der Hochschule; nur Demo.
- Kein bestandener menschlicher Usability-Test oder messbar geringere Fehlerquote.
- Keine V2-Veröffentlichung, bevor Ali den Patch integriert, die Tests ausführt und auf dem physischen Bildschirm überprüft.
- Kein Nachweis, dass Parsa alle Codezeilen des ursprünglichen gemeinsamen Lieferpakets persönlich geschrieben hat.

## Vorschlag für einen realen Test

**Szenario:** Eine Studentin/ein Student öffnet den Raum K1-120 im Stundenplan, gelangt zur Buchung, reserviert ein freies Zeitfenster, sichert Nummer und Stornierungscode und storniert die Reservierung. Beobachten und notieren: Auffindbarkeit des Links, Sichtbarkeit der Bestätigung, Umgang mit dem Timeout, Verständlichkeit von DE/EN, benötigte Hilfestellung. Nur tatsächlich beobachtete Ergebnisse eintragen. Keine personenbezogenen Geheimcodes in Fotos oder Logs veröffentlichen.

## Korrekturen bei der Integration durch Ali (04.11.2026)

Dies ist eine redigierte Arbeitsgrundlage, kein abgeschlossener Fünf-Seiten-Beitrag. Das unveränderte Originalpaket wird lokal außerhalb des Git-Repositories aufbewahrt; SHA-256 und Herkunft stehen in README.md dieser Mappe. Aussagen über vorbereitete Änderungen oben beschreiben den Lieferstand vom 3. November. Den tatsächlichen Integrations- und Teststand dokumentiert `../../evidence/v2-integration-2026-11-04/README.md`.

- PARSA-R001: Der verkürzte Warntext hatte die mögliche bereits bestehende Buchung nicht mehr ausdrücklich genannt; Ali stellte diesen Hinweis in DE/EN wieder her.
- PARSA-R002: Eine neu eingefügte Warnzeile verschob „Mehr Zeit“ am schmalen Kiosk hinter das Dock. Ali ersetzte sie durch eine Warnung im bereits reservierten Countdownbereich.
- PARSA-R003/R004/R006: fehlender Raumzustand im Stundenplan, englischer Stornierungs-Seitentitel sowie Eingabehinweise für 36-/43-Zeichen-Daten wurden bei der Integration ergänzt.
- PARSA-R005: Die historische Foto-Datei wird nicht umbenannt oder als Stundenplanbeleg verwendet. Das Originalfoto bleibt unverändert im lokalen Quellenarchiv.

Automatische Browserprüfungen sind keine Nutzertests; der physische Elo-Touchscreen und die Verständlichkeit mit Menschen bleiben offen.
