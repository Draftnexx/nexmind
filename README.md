# NexMind – The Memory That Thinks

NexMind ist eine KI-gestützte Notiz- und Wissens-App von **Draftnex Solutions**.  
Die App organisiert deine Gedanken automatisch, erkennt Zusammenhänge und erstellt dir wöchentliche Brain Reports.

> **Claim:** The Memory That Thinks.  
> **Deutsch:** Das Gedächtnis, das mitdenkt.

---

## 🎯 Vision

Ein Notizsystem, das sich **selbst organisiert** – ohne Ordner, ohne Tag-Chaos.  
NexMind versteht, was du meinst, sortiert deine Notizen automatisch und verknüpft sie zu einem lebendigen Wissensnetz.

---

## 🧠 Kernidee

- Nutzer schreibt Text oder spricht eine Notiz ein.
- KI erkennt:
  - Art der Notiz (Aufgabe, Termin, Idee, Info, Person, etc.)
  - Themen & Projekte
  - Personen, Orte, wichtige Entitäten
  - Zusammenhänge zu bestehenden Notizen
- Die App:
  - sortiert automatisch
  - verknüpft verwandte Notizen
  - erstellt wöchentliche **Brain Reports**

---

## 🚀 MVP – Funktionsumfang (erste Version)

**Ziel:** Einfacher Web-MVP, der in 2–3 Wochen realistisch umsetzbar ist.

### MVP-Features

- Notizen erstellen (Text)
- KI-Sortierung in Basis-Kategorien:
  - Aufgaben
  - Termine
  - Ideen
  - Infos
  - Personen
- Anzeige ähnlicher Notizen („Verknüpfung Light“)
- Chat-Eingabe:
  - Notizen via Chat erstellen
- Erste Brain-Report-Ansicht:
  - einfache wöchentliche Zusammenfassung (Dummy- oder Basis-Logik)

---

## 🛠 Tech-Stack (geplant)

- **Frontend:** React + TypeScript (Vite) + Tailwind CSS
- **Speicherung (MVP):**
  - lokal (z.B. LocalStorage / IndexedDB / SQLite)
- **Backend (später):**
  - Supabase oder Firebase
- **KI:**
  - API-Anbindung (z.B. OpenAI / Groq) für:
    - Intent Classification (Art der Notiz)
    - Entity Recognition (Personen, Projekte, Themen)
    - Clustering / ähnliche Notizen

---

## 🎨 UI/UX – Style Guide (Kurzfassung)

- **Look & Feel:** minimalistisch, clean, futuristisch, produktiv
- **Farben:**
  - Primär: `#4B72FF` (Draftnex Blau)
  - Akzent/Intelligenz: `#00D4A6`
  - Dark: `#1F1F1F`
  - Neutral: Weiß / Hellgrau `#EAEAEA`
- **Typografie:**
  - Inter / Manrope
- **Design-Prinzipien:**
  - Runde Ecken
  - viel Weißraum
  - Fokus auf Inhalt
  - Chat-Bubbles für AI-Interface

---

## 📌 Roadmap (grob)

1. **Monat 1 – MVP**
   - Notizen + KI-Sortierung (Basis)
   - Chat-Interface
   - Brain-Report (Basic)
2. **Monat 2 – Deep Intelligence**
   - Personen-/Projekt-Erkennung
   - Knowledge-Graph Lite
3. **Monat 3 – Productivity**
   - Erinnerungen, Goals, Habits
   - Cross-Device Sync
4. **Monat 4 – Marktreife**
   - Web-App, Desktop-App (Electron)
   - Pro-Version mit Abo-Modell
