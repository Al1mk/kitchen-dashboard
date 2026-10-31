Betreff: Bitte um Freigabe N1 – Newcomer Guide / LCC Campus Board

Hallo Ali,

ich bereite meinen Teil „Newcomer Guide + Displayprüfung“ vor. Für N1 schlage ich eine kleine statische Seite `/newcomers` mit deutschen und englischen Karten vor: Räume finden, Stundenplan ansehen, aktuelle Hinweise und Hilfe. Dafür möchte ich keine neue Datenbank, öffentliche API oder Admin-CMS ergänzen, sondern die vorhandene Public-Shell und die bestehende Navigation verwenden.

Die aktuelle Vorschau ist ein eigenständiger klickbarer Prototyp. Die Integration in das Next.js-Repository ist noch nicht erfolgt. Ich werde gemeinsame Dateien wie `PublicNav`, `src/lib/i18n/public.ts` und `src/app/page.tsx` nur nach deiner Abstimmung ändern. Der Link zur Karte bleibt aus, bis Aryans Route tatsächlich integriert ist.

Ich prüfe die technischen Daten des realen Displays vor Ort und kennzeichne nicht bestätigte Daten ausdrücklich. Einen Nutzertest werde ich separat dokumentieren; bisher wird kein Testergebnis behauptet.

Kannst du bitte N1 bestätigen oder die gewünschte Änderung nennen? Außerdem: Ist für die öffentliche Kiosk-Oberfläche ein gemeinsamer Reset/Timeout vorgesehen, und soll ich beim B2-Reservierungsbeleg einen Ablauf nach 60 Sekunden berücksichtigen? Ich ändere daran nichts, bevor wir es abgestimmt haben.

Viele Grüße
Reza
