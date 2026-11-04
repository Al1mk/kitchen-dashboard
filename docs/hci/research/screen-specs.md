# Reale Displayprüfung — Reza

**Wichtig:** Teilweise ausgefüllt am 2. November 2026 anhand von Alis Bericht, seinem Einstellungs-Screenshot, dem Gerätefoto und Herstellerunterlagen. Angaben aus Screenshot, Nutzerbericht und Datenblatt sind getrennt; leere/`NOT VERIFIED`-Felder sind keine Messwerte. [Belege FR-01–FR-04](../../evidence/field-review-2026-11-02/README.md).

| Merkmal | Wert | Status | Methode/Quelle | Datum |
|---|---|---|---|---|
| Standort im Gebäude | Küchendisplay am LCC laut Projektkontext und Alis Bericht | Reported; genauer Montageort nicht unabhängig geprüft | Ali / Projektkontext | 2026-11-02 |
| Hersteller/Modell | Elo ET4363L; Teilenummer E344056 | In Screenshot und Gerätefoto erkennbar | FR-02 / FR-03; Seriennummer nicht übernommen | 2026-11-02 |
| Physische Breite × Höhe | NOT VERIFIED | Not verified | Mit Maßband messen | — |
| Native Auflösung | 1920 × 1080 bei 60 Hz im Querformat laut Hersteller | Vendor documented; nicht am Panel gemessen | FR-04, Elo-4363L-Datenblatt | 2026-11-02 |
| Eingestellte Ausgabe | 1080 × 1920 (Default), 60 Hz, Erweiterter Bildschirm | In Screenshot sichtbar; kein CSS-Viewport-Messwert | FR-02, macOS Displays | 2026-11-02 |
| Hoch-/Querformat | Hochformat, Rotation 90° | In Screenshot sichtbar | FR-02 | 2026-11-02 |
| Betriebssystem/Browser | macOS-Oberfläche erkennbar; Version und Browser NOT VERIFIED | Teilweise belegt | FR-02; Version/Browser noch erheben | 2026-11-02 |
| Browser-Viewport / Zoom / DPR | NOT VERIFIED | Not verified | Auf dem angeschlossenen Panel im Browser messen | — |
| Touch-Technologie | TouchPro PCAP für das 4363L-Modell laut Hersteller; reale Touch-Ereignisse ungetestet | Vendor documented | FR-04; keine Annahme über getestete gleichzeitige Kontakte | 2026-11-02 |
| Touch funktioniert über gesamte Fläche | Funktioniert laut Ali derzeit nicht, auch mit USB-zu-USB-C-Adapter | Reported failure; Ursache unbekannt, nicht unabhängig reproduziert | FR-01; Diagnose T35 offen | 2026-11-02 |
| Montagehöhe | NOT VERIFIED; laut Ali für kleinere Personen oben schwer erreichbar | Reported reach concern; keine Höhen-/Reichweitenmessung | FR-01; Messung in T36/T42 | 2026-11-02 |
| Betrachtungs-/Touch-Abstand | NOT VERIFIED | Not verified | Typische Nutzung beobachten | — |
| Umgebungslicht/Reflexion | NOT VERIFIED | Not verified | Zu üblicher Betriebszeit beobachten | — |
| Netzwerk/Verbindung | NOT VERIFIED | Not verified | Verantwortliche fragen | — |
| Schmutz/Feuchtigkeit im Küchenkontext | Zu prüfen | Assumption to check | Beobachtung ohne Eingriff | — |

## Offene nächste Schritte

- T35: USB-Datenpfad, Erkennung durch macOS, Treiberkompatibilität und anschließend Touch-Zuordnung/Rotation prüfen. Ein sichtbares Videobild beweist keine funktionierende Touch-Verbindung.
- T36/T42: Montage-/Reichweitenmessung und reale Touch-Bedienung; bis dahin kein bestandenes Hardware-/Barrierefreiheitsergebnis.
- T37–T41: Alis gewünschte Layout-/Textänderungen sind [erfasst, noch nicht umgesetzt](../requests/2026-11-02-physical-kiosk-review.md).

## Vorgehen
1. Verantwortliche Person um Erlaubnis bitten; keine Systemeinstellungen ohne Zustimmung ändern.
2. Fotos nur mit Erlaubnis und ohne Personen/Datenschutzrisiko aufnehmen.
3. Tatsächliche Messwerte samt Datum erfassen.
4. Vermutungen mit `Assumed` kennzeichnen; unbekannte Werte mit `Not verified`.
5. Falls nur Laptop/Browser getestet wird, dies als simulierte Hochformatansicht kennzeichnen, nicht als echten Kiosk-Test.
