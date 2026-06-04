# Loom-Skript (natürlich, zum direkt Vorlesen) · Deutsch

> Diese Version kannst du **direkt vorlesen** — sie ist in lockerem, gesprochenem Deutsch geschrieben,
> damit es natürlich klingt und nicht auswendig gelernt. Tipp: trotzdem ruhig kleine Pausen machen,
> locker bleiben — und wenn du einen Satz lieber anders sagst, mach das einfach. Kleine Versprecher
> oder ein „ähm" sind völlig okay, das wirkt echt.

**Vor der Aufnahme:** lokal starten (`npm run dev` → http://localhost:3000), Beispiel-Dokument laden,
Browser aufräumen (keine Lesezeichenleiste), Zoom ~110 %. Eval vorher einmal laufen lassen
(`npm run eval`) und das Terminal offen lassen. Ziel: **6–8 Minuten** — wenn's zu lang wird, Szene 5
weglassen.

---

### Szene 0 — Einstieg (~35 Sek)
*[AKTION: App offen, Startbildschirm]*

„Hi, ich bin Omar. Für diese Aufgabe hab ich einen NotebookLM-Klon gebaut — erstmal als
Proof-of-Concept. Ich hab das Ganze mit Claude als KI-Tool entwickelt. Mein eigener Fokus lag dabei
weniger aufs reine Code-Tippen, sondern eher darauf, das Produkt wirklich zum Laufen zu bringen: also
viel selbst zu testen, Schwachstellen und sinnvolle Verbesserungen zu finden, und bewusst zu
recherchieren, welche Technologie für welchen Teil am besten passt — für den POC und auch für später
in Produktion — und vor allem: warum.

Bevor ich euch das Ergebnis zeige, ganz kurz mein Leitgedanke: Der eigentliche Wert von NotebookLM
ist nicht der Upload oder der Chat. Der Kern ist **Vertrauen**. Die Antworten kommen
nur aus euren Quellen, sie sind belegt, und das System ist ehrlich, wenn's was nicht weiß."

### Szene 1 — Belegte Antwort (~55 Sek)
*[AKTION: eine Frage stellen, z. B. „Wie viele Urlaubstage gibt's?"]*

„Ich hab hier eine Quelle geladen und stell jetzt einfach mal eine Frage. … Und ihr seht: die Antwort
ist belegt — jede Aussage hat so eine Quellenangabe. Und wenn ich auf so eine Nummer klicke …“
*[AKTION: auf die [1] klicken → Quelle öffnet sich, Stelle ist markiert]*
„… dann öffnet sich die Quelle, und genau die Textstelle wird markiert. Das heißt: jede Antwort ist
mit einem Klick überprüfbar.

Übrigens, was ihr gerade nebenbei seht: das Dokument ist auf Englisch, ich frag auf Deutsch — und
krieg die Antwort auf Deutsch zurück. Das System antwortet immer in der Sprache der Frage."

### Szene 2 — Verweigern statt Erfinden (~45 Sek) · **wichtigste Szene**
*[AKTION: etwas fragen, das NICHT in der Quelle steht, z. B. „Wie hoch ist der Umsatz?"]*

„Und jetzt kommt das, worauf's mir am meisten ankommt. Ich frag jetzt was, das gar nicht in den
Quellen steht … Und ihr seht: das System rät nicht und erfindet auch nichts. Es sagt ganz klar, dass
es dafür keine ausreichenden Belege hat, und zeigt mir nur, was es Ähnliches gefunden hat.

Die meisten Klone würden hier selbstbewusst irgendwas halluzinieren — meiner nicht. Und dieses
ehrliche ‚Ich weiß es nicht' ist für ein Firmen-Tool eigentlich die wichtigste Eigenschaft. Denn ein
System, das überzeugend falsche Antworten gibt, ist schlimmer als nutzlos."

### Szene 3 — Studio (~60 Sek)
*[AKTION: Studio rechts → „Summary" generieren]*

„Hier rechts ist das Studio. Ich kann mir zum Beispiel eine Zusammenfassung vom ganzen Dokument
erzeugen lassen — auch wieder mit Quellenangaben. Dann gibt's eine automatische FAQ …“
*[AKTION: FAQ generieren]*
„… und eine Audio-Übersicht, die komplett kostenlos direkt im Browser vorgelesen wird.“
*[AKTION: Audio Overview generieren, kurz auf Play, ein paar Sekunden hören lassen]*
„Und jedes Ergebnis wird als Karte gespeichert — ich kann's wieder öffnen, umbenennen oder löschen,
so ähnlich wie im echten NotebookLM."

### Szene 4 — Kontext & Folgefragen (~30 Sek)
*[AKTION: Folgefrage mit Pronomen, z. B. „Und wie viele Roboter kann es verwalten?"]*

„Der Chat merkt sich auch den Kontext. Wenn ich jetzt eine Folgefrage stelle und einfach ‚es' oder
‚das' sage, versteht er trotzdem, was gemeint ist. Und nach jeder Antwort schlägt er mir noch ein
paar sinnvolle Folgefragen vor."

### Szene 5 — Quellen (optional, ~20 Sek) · *bei Zeitmangel weglassen*
*[AKTION: kurz zeigen: PDF / Web-URL / YouTube]*

„Als Quelle funktionieren übrigens PDFs, Webseiten und auch YouTube-Videos — da wird automatisch das
Transkript geladen."

### Szene 6 — Evaluation (~55 Sek)
*[AKTION: Terminal mit dem `npm run eval`-Ergebnis zeigen]*

„Mir war wichtig, nicht nur zu behaupten, dass das funktioniert — sondern es auch zu messen. Dafür
hab ich eine kleine Evaluation gebaut: zwölf Fragen, die beantwortbar sind, und acht, die's nicht
sind. Das Ergebnis: zwanzig von zwanzig richtig, null Halluzinationen.

Und beim Testen hab ich was Spannendes gemerkt: Ähnlichkeit allein reicht nicht. So eine Frage wie
‚Wie hoch ist der Umsatz?' sieht thematisch total passend aus, ist aber gar nicht beantwortbar. Genau
deshalb hab ich zwei Stufen eingebaut — einmal eine feste Schwelle, und einmal die Selbsteinschätzung
des Modells. Keine von beiden allein schafft die hundert Prozent.

Und generell: ich hab nicht einfach gebaut und gehofft, dass es klappt. Ich hab mit echten PDFs und
Videos getestet, drei reale Probleme gefunden und behoben, und den Client robust gemacht, falls man
mal ans API-Limit kommt."

### Szene 7 — Bewusste Entscheidungen & Produktion (~45 Sek)

„Ein paar Sachen hab ich ganz bewusst weggelassen — zum Beispiel bezahlte, hochwertige Stimmen, einen
Login oder eine externe Datenbank. Nicht, weil ich den Weg nicht kenne, sondern um in kurzer Zeit und
zu null Kosten erstmal die Idee zu beweisen. Alles läuft auf kostenlosen Tiers. Und für jede dieser
Vereinfachungen hab ich den Weg in die Produktion dokumentiert — also echte Vektor-Datenbank,
bezahltes Kontingent, Mehrbenutzer und so weiter. Mein Prinzip war: erst Vertrauen schaffen, dann
skalieren.

Und ich bin auch ehrlich bei den Grenzen: YouTube und reine JavaScript-Seiten lassen sich von so
einem kostenlosen Server aus nicht zuverlässig laden — das liegt an IP-Sperren und am Rendering im
Browser, nicht an einem Fehler im Code. Lokal läuft YouTube einwandfrei; in Produktion löst man das
mit spezialisierten Diensten."

### Szene 8 — Abschluss (~20 Sek)

„Also, kurz gesagt: Ich hab nicht einfach einen NotebookLM-Klon gebaut, sondern einen
**vertrauenswürdigen** — belegt, ehrlich bei Unsicherheit, und das Ganze mit einer Evaluation auch
bewiesen. Der konkrete Nutzen: schnelleres, verlässliches Wissen, dem Mitarbeiter wirklich trauen
können. Das Projekt ist live deployed und der Code liegt auf GitHub. Danke fürs Zuschauen — ich freu
mich auf euer Feedback!"

---

## Aufnahme-Checkliste
- [ ] Lokal gestartet (`npm run dev`), Beispiel- oder deutsche Quelle geladen
- [ ] Eval vorher gelaufen, Terminal-Fenster offen
- [ ] Browser aufgeräumt, Zoom ~110 %, Mikro getestet
- [ ] 1 kurzer Probelauf (auf Kontingent achten: ~20 Generierungen/Tag)
- [ ] Aufnahme < 8 Min, mit der Verweigerung (Szene 2) früh im Video
- [ ] Danach: Loom-Link kopieren, in die Antwort-E-Mail an Everlast
