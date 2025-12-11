# NexMind – MVP Spezifikation

## 1. Ziel

Ein Web-MVP von NexMind, der zeigt:
- KI-gestützte automatische Kategorisierung von Notizen
- einfache Verknüpfung ähnlicher Notizen
- Chat-Eingabe
- einfache Brain-Report-Ansicht

Fokus: **funktionierender Prototyp**, kein perfektes Design.

---

## 2. Screens / Views (MVP)

### 2.1 Main Layout

- Header mit:
  - Logo / App-Name „NexMind“
  - Toggle: Light/Dark-Mode (optional)
- Seitenlayout:
  - Links: Liste der Kategorien
  - Mitte: Notizliste
  - Rechts: Detail/Chat-Bereich (oder als separater View bei Mobile)

### 2.2 Notizliste

- Liste aller Notizen mit:
  - Titel (erste Zeile der Notiz)
  - Kategorie (Badge)
  - Datum
- Filtermöglichkeiten:
  - nach Kategorie (Aufgaben, Termine, Ideen, Infos, Personen)
  - Suche (Text)

### 2.3 Notiz-Erstellen

- Einfaches Textfeld:
  - „Schreib deine Notiz…“
- Button: „Speichern“
- Nach dem Speichern:
  - KI-Call (Mock/Platzhalter im MVP) klassifiziert Notiz in eine Kategorie
  - Notiz in Liste einfügen

### 2.4 Chat-View

- Chat-Interface mit:
  - Messages: Nutzer (links), KI / System (rechts)
  - Textinput unten mit „Senden“-Button
- Wenn Nutzer eine Nachricht schreibt:
  - Wird als Notiz gespeichert
  - KI versucht ebenfalls Kategorie zuzuordnen
- Später erweiterbar zu:
  - „Bitte fasse mir alle Ideen der letzten Woche zusammen“
  - „Zeig mir alle Notizen zu Projekt X“

### 2.5 Brain Report (Basis)

- Einfache Seite/Section:
  - Anzahl aller Notizen der Woche
  - Anzahl nach Kategorien
  - Liste der „Top-Ideen“ (z.B. längere/markierte Notizen)
- Im MVP:
  - einfache Logik (keine echte KI nötig)
  - Daten z.B. aus den letzten 7 Tagen

---

## 3. Datenmodell (MVP)

### 3.1 Note

```ts
type NoteCategory = "task" | "event" | "idea" | "info" | "person";

interface Note {
  id: string;
  content: string;
  category: NoteCategory;
  createdAt: string;
  updatedAt?: string;
  relatedNoteIds?: string[];
}
