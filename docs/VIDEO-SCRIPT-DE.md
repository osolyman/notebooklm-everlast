# Loom-Skript (Deutsch) — NotebookLM-Klon für Everlast AI

Ziel: 5–7 Minuten, **entscheidungsorientiert** (nicht nur Feature-Liste). Mit der wichtigsten
Eigenschaft zuerst: das System verweigert eine Antwort, wenn die Belege fehlen.

**Vor der Aufnahme:** lokal starten (`npm run dev` → http://localhost:3000), Beispiel-Dokument laden,
Browser aufräumen (keine Lesezeichenleiste), Zoom ~110%. Eval-Ergebnis vorher einmal laufen lassen
und das Terminal-Fenster offen lassen (nicht live im Video laufen lassen — spart Zeit & Kontingent).

> Tipp: Für ein durchgehend deutsches Demo eine **deutsche Quelle** verwenden (z. B. ein deutsches
> PDF oder das deutsche YouTube-Video, das du getestet hast). Dann sind Quelle, Fragen und Antworten
> alle auf Deutsch. Das Beispiel-Dokument ist englisch — Fragen auf Deutsch funktionieren trotzdem.

---

### Szene 0 — Einstieg (~20 Sek.)
*[AKTION: App offen, Startbildschirm]*

„Hi, ich bin Omar. Als Aufgabe habe ich einen NotebookLM-Klon gebaut. Bevor ich euch das Ergebnis
zeige, kurz mein Leitgedanke: Der eigentliche Wert von NotebookLM ist nicht der Datei-Upload oder der
Chat — das kann jeder. Der Kern ist **Vertrauen**: Antworten kommen ausschließlich aus euren Quellen,
sind belegt, und das System ist ehrlich, wenn es etwas nicht weiß. Genau da habe ich meine Zeit
investiert.“

### Szene 1 — Belegte Antwort (~60 Sek.)
*[AKTION: Frage stellen, z. B. „Wie viele Urlaubstage bekommen Mitarbeiter?“]*

„Ich habe hier eine Quelle geladen und stelle eine Frage. Die Antwort ist **belegt** — jede Aussage
hat eine Quellenangabe. Und wenn ich auf so eine Quellenangabe klicke …“
*[AKTION: auf die Zahl [1] klicken → Quelle öffnet sich, Stelle ist markiert]*
„… öffnet sich die Quelle und genau die Textstelle wird markiert. Das heißt: jede Antwort ist in
einem Klick überprüfbar.“

### Szene 2 — Das Wichtigste: Verweigern statt Erfinden (~45 Sek.)
*[AKTION: Frage stellen, die NICHT in der Quelle steht, z. B. „Wie hoch ist der Umsatz des Unternehmens?“]*

„Und jetzt das, worauf es mir am meisten ankommt. Ich frage etwas, das **nicht** in den Quellen
steht. Das System rät nicht und erfindet nichts — es sagt klar: dafür habe ich keine ausreichenden
Belege, und zeigt nur, was es Ähnliches gefunden hat. Die meisten Klone halluzinieren hier
selbstbewusst. Meiner nicht. Dieses ehrliche ‚Ich weiß es nicht‘ ist für ein Unternehmens-Tool die
**wichtigste** Eigenschaft — denn ein System, das überzeugend falsche Antworten gibt, ist schlimmer
als nutzlos.“

### Szene 3 — Studio: Zusammenfassung, FAQ, Audio (~60 Sek.)
*[AKTION: Studio rechts; „Summary“ generieren]*

„Rechts ist das Studio. Ich kann eine **Zusammenfassung** des ganzen Dokuments erzeugen — ebenfalls
mit Quellenangaben. Dann eine automatische **FAQ** …“
*[AKTION: FAQ generieren]*
„… und eine **Audio-Übersicht**, die komplett kostenlos direkt im Browser vorgelesen wird.“
*[AKTION: Audio Overview generieren, kurz auf Play, ein paar Sekunden hören lassen]*
„Jedes Ergebnis wird als Karte gespeichert — ich kann es öffnen, umbenennen oder löschen, genau wie
im echten NotebookLM.“

### Szene 4 — Kontext & Folgefragen (~30 Sek.)
*[AKTION: Folgefrage mit Pronomen, z. B. „Und wie viele Roboter kann es verwalten?“]*

„Der Chat merkt sich den Kontext. Wenn ich eine Folgefrage mit ‚es‘ oder ‚das‘ stelle, versteht er
den Bezug. Und nach jeder Antwort schlägt er sinnvolle **Folgefragen** vor.“

### Szene 5 — Quellen-Vielfalt (~20 Sek., optional)
*[AKTION: kurz zeigen: PDF / Web-URL / YouTube-Link]*

„Als Quelle funktionieren PDFs, Webseiten und YouTube-Videos — bei YouTube wird automatisch das
Transkript geladen.“
*(Hinweis: YouTube läuft lokal zuverlässig; deshalb lokal aufnehmen.)*

### Szene 6 — Der Beweis: Evaluation (~45 Sek.)
*[AKTION: Terminal mit dem `npm run eval`-Ergebnis zeigen]*

„Ich behaupte nicht nur, dass es funktioniert — ich **messe** es. Ich habe eine kleine Evaluation
gebaut: zwölf beantwortbare und acht nicht-beantwortbare Fragen. Ergebnis: **20 von 20 korrekt, null
Halluzinationen**. Spannend war die Erkenntnis: Ähnlichkeit allein reicht nicht — eine Frage wie ‚Wie
hoch ist der Umsatz?‘ sieht thematisch passend aus. Deshalb habe ich **zwei Stufen**: eine
deterministische Schwelle UND die Selbsteinschätzung des Modells. Keine der beiden allein erreicht
100 %.“

### Szene 7 — Bewusste Entscheidungen & Weg zur Produktreife (~45 Sek.)

„Ein paar **bewusste** Entscheidungen: Ich habe auf bezahlte Audio-Stimmen, Login und eine externe
Datenbank verzichtet — nicht, weil ich den Weg nicht kenne, sondern um in kurzer Zeit und zu **null
Kosten** die Idee zu beweisen. Alles läuft auf kostenlosen Tiers. Für jede Vereinfachung habe ich den
Produktiv-Weg dokumentiert: echte Vektor-Datenbank, bezahltes Modell-Kontingent, Mehrbenutzer. Erst
Vertrauen schaffen, dann skalieren und ausbauen.“

### Szene 8 — Abschluss (~20 Sek.)

„Kurz gesagt: Ich habe nicht einfach einen NotebookLM-Klon gebaut, sondern einen
**vertrauenswürdigen** — belegt, ehrlich bei Unsicherheit, und mit einer Evaluation bewiesen. Der
geschäftliche Nutzen: schnelleres, verlässliches Wissen, dem Mitarbeiter wirklich trauen können.
Es ist außerdem live deployed und der Code liegt auf GitHub. Danke fürs Zuschauen — ich freue mich
auf eure Rückmeldung!“

---

## Aufnahme-Checkliste
- [ ] Lokal gestartet (`npm run dev`), Beispiel- oder deutsche Quelle geladen
- [ ] Eval vorher gelaufen, Terminal-Fenster offen
- [ ] Browser aufgeräumt, Zoom ~110 %, Mikro getestet
- [ ] 1 kurzer Probelauf (auf Kontingent achten: ~20 Generierungen/Tag)
- [ ] Aufnahme < 7 Min, mit der Verweigerung früh im Video
- [ ] Danach: Loom-Link kopieren, in die Antwort-E-Mail an Everlast
