# HCI – Raumsuche mit kontextabhängiger Eingabevalidierung (V12.2)

## Änderung
- Unter dem Suchfeld erscheint nach einer kurzen Schreibpause (480 ms) **ein roter, konkreter Formathinweis** bei ungültigen Raumnummern, z. B. `K1-12x`.
- Gültige Eingaben: `K1-120`, `K1 120`, `120`. Raumnamensuche bleibt möglich.
- Korrekte Eingaben lassen den Hinweis sofort verschwinden; beim Absenden verhindert die Validierung eine falsche Auswahl.
- Fehlermeldung in Deutsch und Englisch; `aria-invalid`, `aria-describedby` und `role="status"` unterstützen Assistive Technology.
- Die ursprünglichen drei Bildkarten und 47 K1-Marker wurden **nicht** verändert.

## HCI-Bezug
Fehlervermeidung, unmittelbares Systemfeedback, verständliche Handlungsanweisung, Wiederherstellung nach fehlerhafter Eingabe und Accessibility. Der mögliche Nutzen ist durch einen echten Usability-Test noch zu untersuchen.

## Prüfschritte
`K1-12x` → rote Hilfe; `K1-120` → Fehler verschwindet, erstes OG; `120` und `K1 120` → akzeptiert; `Seminarraum` → kein Formatfehler; `K1-210`/`K1-303` → automatische Etagenwahl; mobil und DE/EN prüfen.

Hinweis: Bildbasierter Designprototyp; kein amtlicher Raumplan, keine Live-Stundenpläne.

### QA-Hotfix V12.1 / V12.2
- K1-215a / K1-215b: validieren und direkt auswählen.
- Beim manuellen Geschosswechsel werden Suchfilter und Fehlermeldung zurückgesetzt.

### Robustheit und Touch-Bedienung in V12.2
- Sprechende Fehlermeldungen bei fehlenden Raumdaten oder fehlenden Kartenbildern statt stiller Bedienfehler.
- Zusätzliche unsichtbare Touchflächen an den Nummernmarkern (ohne visuelle Änderung der roten Raumnummern).
- Größere Touchziele für Zoom, Sprachwechsel und Löschen.
- Korrekte lokalisierte Screenreader-Bezeichnungen für die wichtigen Bedienelemente.
- Touch-Bereiche und K1-120 wurden im mobilen Browser überprüft.
