/** Optional: creates a NEW anonymous usability form. To preserve the old form URL, edit it manually instead. */
function createLCCNavigatorUsabilityFormV12_2() {
  const form = FormApp.create('LCC Navigator – HCI-Kurztest V12.2 (ca. 3 Minuten)');
  form.setDescription('Bitte vorab die Karten-Demo testen: K1-12x (absichtlich falsch), dann K1-120, K1-210, K1-215a und K1-303 sowie Seminarraum. Dies ist kein offizieller Gebäudeplan. Freiwillig und anonym.');
  form.setCollectEmail(false);
  function choice(title, options) {
    const item = form.addMultipleChoiceItem();
    item.setTitle(title);
    item.setChoices(options.map(option => item.createChoice(option)));
    item.setRequired(true);
  }
  choice('Konntest du die gesuchten Raumnummern finden?', ['Ja','Teilweise','Nein']);
  choice('War der rote Hinweis bei der absichtlich falschen Eingabe verständlich und hilfreich?', ['Ja','Teilweise','Nein']);
  choice('War die Zuordnung der Raumnummern auf der Karte verständlich?', ['Ja','Teilweise','Nein']);
  form.addScaleItem().setTitle('Wie einfach war die Suche insgesamt?').setBounds(1,5).setLabels('sehr schwer','sehr einfach').setRequired(true);
  form.addParagraphTextItem().setTitle('Was würdest du an Suche, Fehlermeldung oder Karte verbessern? (optional)').setRequired(false);
  Logger.log('LINK FÜR TEILNEHMER: ' + form.getPublishedUrl());
  Logger.log('LINK ZUM BEARBEITEN: ' + form.getEditUrl());
}
