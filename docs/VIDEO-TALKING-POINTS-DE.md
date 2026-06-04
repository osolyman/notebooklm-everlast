# Loom — Sprechnotizen (natürlich, locker) · Deutsch

> Das hier ist die **menschliche Version**: Stichpunkte statt fertiges Skript. Sprich frei, in
> deinen eigenen Worten — du kennst das Projekt besser als jeder andere. Nur die **Ankersätze**
> (fett) solltest du ungefähr so bringen, das sind deine stärksten Aussagen.
> (Das ausformulierte Skript bleibt in `VIDEO-SCRIPT-DE.md` als Backup/Nachschlagewerk.)

### So klingt es echt (kurz lesen vor der Aufnahme)
- **Nicht ablesen.** Ablesen klingt auswendig gelernt. Stichpunkte = du redest natürlich.
- Lockere, gesprochene Sprache ist gut: „ich hab", „gibt's", „son bisschen", „also", „genau".
- Kürzere Sätze. Lieber zwei kurze als ein verschachtelter.
- Ein „ähm", eine kleine Pause, eine Selbstkorrektur? **Völlig okay** — wirkt menschlich und sicher.
- Einmal locker zum Aufwärmen durchsprechen, dann aufnehmen. Lieber zwei kurze Takes als ein
  erzwungener „perfekter".
- Beschreib einfach, was du auf dem Bildschirm machst, während du klickst — das trägt von selbst.

---

### Szene 0 — Einstieg (~30 Sek)
- Kurz vorstellen, wer du bist.
- Was: NotebookLM-Klon, als **Proof-of-Concept**.
- Wie: mit **Claude** als KI-Tool gebaut.
- Dein Anteil: viel **selbst getestet**, Verbesserungen gesucht, **recherchiert**, welche Technologie
  für welchen Teil passt — für den POC und für später in Produktion — und *warum*.
- **Ankersatz:** „Der eigentliche Wert von NotebookLM ist nicht der Upload oder der Chat — das kann
  jeder. Der Kern ist **Vertrauen**: Antworten kommen nur aus deinen Quellen, sind belegt, und das
  System ist ehrlich, wenn's was nicht weiß. Genau da hab ich meine Zeit reingesteckt."

### Szene 1 — Belegte Antwort (~50 Sek)
- Sag: Quelle ist geladen, ich stell mal ne Frage. *(z. B. „Wie viele Urlaubstage gibt's?")*
- Zeig: jede Aussage hat ne Quellenangabe.
- Klick auf die Nummer → Quelle geht auf, die Stelle ist markiert.
- **Ankersatz:** „Das heißt: jede Antwort ist in einem Klick überprüfbar."
- Mehrsprachig (natürlich nebenbei): „Übrigens — das Dokument ist Englisch, ich frag auf Deutsch und
  krieg auch Deutsch zurück. Es antwortet immer in der Sprache der Frage."

### Szene 2 — Verweigern statt Erfinden (~40 Sek) · **wichtigste Szene**
- Sag: jetzt kommt das, worauf's mir am meisten ankommt.
- Frag was, das **nicht** drinsteht *(z. B. „Wie hoch ist der Umsatz?")*.
- Zeig: es erfindet nichts, sagt klar „keine ausreichenden Belege", zeigt nur Ähnliches.
- **Ankersatz:** „Die meisten Klone halluzinieren hier selbstbewusst. Meiner nicht. Dieses ehrliche
  ‚Ich weiß es nicht' ist für ein Firmen-Tool das Wichtigste — ein System, das überzeugend falsche
  Antworten gibt, ist schlimmer als nutzlos."

### Szene 3 — Studio (~50 Sek)
- Rechts ist das Studio.
- **Zusammenfassung** generieren (auch mit Quellen).
- **Auto-FAQ** generieren.
- **Audio-Übersicht** → auf Play, ein paar Sekunden hören lassen. Sag: läuft komplett kostenlos im
  Browser.
- Erwähne: jedes Ergebnis wird als Karte gespeichert — öffnen, umbenennen, löschen, wie im echten
  NotebookLM.

### Szene 4 — Kontext & Folgefragen (~25 Sek)
- Folgefrage mit „es" oder „das" stellen *(z. B. „Und wie viele Roboter kann es verwalten?")*.
- Zeig: er versteht den Bezug. Und nach jeder Antwort schlägt er Folgefragen vor.

### Szene 5 — Quellen (optional, ~20 Sek) · *bei Zeitmangel weglassen*
- Kurz: PDF, Webseite, YouTube (da wird automatisch das Transkript geladen).

### Szene 6 — Evaluation (~50 Sek)
- Sag: ich behaupt nicht nur, dass es geht — ich **mess** es.
- Eval kurz: 12 beantwortbare, 8 nicht beantwortbare Fragen → **20 von 20, keine Halluzinationen**.
- **Ankersatz (die Erkenntnis):** „Beim Testen hab ich was Spannendes gemerkt: Ähnlichkeit allein
  reicht nicht. Ne Frage wie ‚Wie hoch ist der Umsatz?' sieht thematisch passend aus, ist aber nicht
  beantwortbar. Deshalb hab ich zwei Stufen — ne feste Schwelle UND die Selbsteinschätzung des
  Modells. Keine von beiden allein schafft 100 %."
- Kurz Testen/Härten: mit echten PDFs und Videos getestet, drei reale Bugs gefunden und behoben, und
  den Client robust gemacht gegen die API-Limits.

### Szene 7 — Bewusste Entscheidungen & Produktion (~40 Sek)
- Bewusst weggelassen: bezahlte Stimmen-Qualität, Login, externe Datenbank — um **schnell und
  kostenlos** die Idee zu beweisen.
- Für jede Vereinfachung hab ich den Produktiv-Weg dokumentiert.
- **Ankersatz:** „Erst Vertrauen schaffen, dann skalieren."
- Ehrliche Grenzen: YouTube und reine JavaScript-Seiten gehen von einem kostenlosen Server aus nicht
  zuverlässig — das ist IP-Sperre und Client-Rendering, kein Bug. Lokal läuft YouTube einwandfrei.

### Szene 8 — Abschluss (~20 Sek)
- **Ankersatz:** „Kurz gesagt: Ich hab nicht einfach einen NotebookLM-Klon gebaut, sondern einen
  **vertrauenswürdigen** — belegt, ehrlich bei Unsicherheit, und mit einer Evaluation bewiesen."
- Nutzen: schnelleres, verlässliches Wissen, dem man wirklich trauen kann.
- Es ist live deployed, der Code liegt auf GitHub. Danke fürs Zuschauen — ich freu mich auf euer
  Feedback!

---

### Falls du doch einen Satz vergisst
Kein Problem — sag ihn einfach mit anderen Worten. Der Inhalt zählt, nicht der genaue Wortlaut. Du
kennst jedes Teil des Systems; sprich aus diesem Wissen heraus, dann klingt es automatisch echt.
