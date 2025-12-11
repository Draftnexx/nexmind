import { NoteCategory } from "../types/note";

/**
 * Mock-KI: Klassifiziert eine Notiz basierend auf einfachen Keyword-Regeln
 * @param content Der Notizinhalt
 * @returns Die erkannte Kategorie
 */
export function classifyNote(content: string): NoteCategory {
  const lowerContent = content.toLowerCase();

  // Aufgaben-Keywords
  const taskKeywords = [
    "todo", "erledigen", "aufgabe", "machen", "fertig", "deadline",
    "abgeben", "task", "checklist", "must", "sollte", "muss"
  ];

  // Event/Termin-Keywords
  const eventKeywords = [
    "termin", "meeting", "treffen", "datum", "uhr", "uhrzeit",
    "morgen", "heute", "montag", "dienstag", "mittwoch", "donnerstag",
    "freitag", "samstag", "sonntag", "event", "veranstaltung", "kalendar"
  ];

  // Ideen-Keywords
  const ideaKeywords = [
    "idee", "vielleicht", "könnte", "wäre", "eventuell", "möglicherweise",
    "brainstorm", "konzept", "vision", "innovation", "kreativ"
  ];

  // Personen-Keywords
  const personKeywords = [
    "person", "kontakt", "telefon", "email", "anrufen", "sprechen mit",
    "nachricht an", "@", "herr", "frau", "kollege", "kollegin", "chef"
  ];

  // Info als Standard-Kategorie
  let category: NoteCategory = "info";

  // Zähle Treffer für jede Kategorie
  const taskMatches = taskKeywords.filter(kw => lowerContent.includes(kw)).length;
  const eventMatches = eventKeywords.filter(kw => lowerContent.includes(kw)).length;
  const ideaMatches = ideaKeywords.filter(kw => lowerContent.includes(kw)).length;
  const personMatches = personKeywords.filter(kw => lowerContent.includes(kw)).length;

  // Bestimme Kategorie mit den meisten Treffern
  const maxMatches = Math.max(taskMatches, eventMatches, ideaMatches, personMatches);

  if (maxMatches === 0) {
    return "info"; // Fallback
  }

  if (taskMatches === maxMatches) {
    category = "task";
  } else if (eventMatches === maxMatches) {
    category = "event";
  } else if (ideaMatches === maxMatches) {
    category = "idea";
  } else if (personMatches === maxMatches) {
    category = "person";
  }

  return category;
}

/**
 * Generiert eine eindeutige ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
