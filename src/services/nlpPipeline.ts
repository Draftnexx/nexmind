import { NoteCategory } from "../types/note";
import { classifyNote as mockClassifyNote } from "../utils/classifyNote";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-70b-versatile";
const API_TIMEOUT = 15000; // 15 seconds for complex analysis

/**
 * NLP PIPELINE V6 - UNIFIED INTELLIGENCE
 *
 * Single entry point for all text analysis.
 * Replaces all fragmented AI logic with one robust pipeline.
 */

export interface NlpItem {
  id: string;               // locally generated
  type: "task" | "event" | "idea" | "info" | "person_note";
  content: string;
  category: "task" | "event" | "idea" | "info" | "person";
  groupId?: string;         // links items from same input
  dueDate?: string | null;  // ISO string, e.g. "2025-02-01"
  priority?: "low" | "medium" | "high";
  entities: {
    persons: string[];
    places: string[];
    projects: string[];
    topics: string[];
  };
  reasoning?: string;       // AI's explanation
}

export interface NlpAnalysisResult {
  items: NlpItem[];
  contextSummary?: string;
  globalTopics?: string[];
  globalEntities?: {
    persons: string[];
    places: string[];
    projects: string[];
    topics: string[];
  };
}

/**
 * Checks if Groq API key is available
 */
function hasGroqApiKey(): boolean {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  return !!apiKey && apiKey !== "your_groq_api_key_here";
}

/**
 * Generates a unique group ID for items from the same input
 */
function generateGroupId(): string {
  return `g_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generates a unique item ID
 */
function generateItemId(): string {
  return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Parses relative date expressions to ISO date strings
 * Examples: "morgen", "Freitag", "nächste Woche", "in 2 Wochen"
 */
export function parseRelativeDate(dateExpression: string | null): string | null {
  if (!dateExpression) return null;

  const today = new Date();
  const expr = dateExpression.toLowerCase().trim();

  // Heute
  if (expr === "heute" || expr === "today") {
    return today.toISOString().split('T')[0];
  }

  // Morgen
  if (expr === "morgen" || expr === "tomorrow") {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  // Übermorgen
  if (expr === "übermorgen" || expr === "day after tomorrow") {
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    return dayAfter.toISOString().split('T')[0];
  }

  // Wochentage (nächster Montag, Dienstag, etc.)
  const weekdays = ["sonntag", "montag", "dienstag", "mittwoch", "donnerstag", "freitag", "samstag"];
  const currentDay = today.getDay();

  for (let i = 0; i < weekdays.length; i++) {
    if (expr.includes(weekdays[i])) {
      let daysUntil = i - currentDay;
      if (daysUntil <= 0) daysUntil += 7; // Next occurrence

      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + daysUntil);
      return targetDate.toISOString().split('T')[0];
    }
  }

  // Nächste Woche (Montag der nächsten Woche)
  if (expr.includes("nächste woche") || expr === "next week") {
    const daysUntilNextMonday = (8 - currentDay) % 7 || 7;
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + daysUntilNextMonday);
    return nextWeek.toISOString().split('T')[0];
  }

  // In X Tagen / In X Wochen
  const inDaysMatch = expr.match(/in (\d+) tag/);
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1]);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);
    return futureDate.toISOString().split('T')[0];
  }

  const inWeeksMatch = expr.match(/in (\d+) woche/);
  if (inWeeksMatch) {
    const weeks = parseInt(inWeeksMatch[1]);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + (weeks * 7));
    return futureDate.toISOString().split('T')[0];
  }

  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(expr)) {
    return expr;
  }

  return null;
}

/**
 * MAIN ENTRY POINT: Unified NLP Pipeline
 *
 * Analyzes user input and returns structured data for:
 * - Notes
 * - Tasks
 * - Events
 * - Entities
 * - Knowledge Graph
 * - Brain Report
 */
export async function analyzeUserInput(text: string): Promise<NlpAnalysisResult> {
  if (!hasGroqApiKey()) {
    console.log("🤖 NLP Pipeline: Using fallback (no API key)");
    return fallbackAnalysis(text);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const todayISO = new Date().toISOString().split('T')[0];

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content: `Du bist ein präziser NLP-Assistent, der deutsche Texte in strukturierte Einträge für eine Produktivitäts-App umwandelt.

AUFGABEN:
1. Erkenne ALLE separaten sinnvollen Items (Aufgaben, Termine, Ideen, Infos, Personen-Notizen)
2. Extrahiere Fälligkeiten aus Ausdrücken wie "morgen", "Freitag", "nächste Woche", konkreten Daten
3. Bestimme Wichtigkeit (Priority) aus Kontext ("muss" → high, "sollte" → medium, "könnte" → low)
4. Erkenne Personen, Orte, Projekte, Themen
5. Gruppiere logisch zusammengehörende Items (gleiche groupId)

KATEGORIEN:
- task: Aufgaben, Todos, Dinge die getan werden müssen
- event: Termine, Meetings, zeitgebundene Ereignisse
- idea: Ideen, Vorschläge, Kreatives
- info: Informationen, Fakten, Notizen
- person: Personenbezogene Notizen, Kontakte

PROJEKTE AUTOMATISCH ERKENNEN:
- "Miete" → Projekt "Finanzen"
- "Bewerbung" → Projekt "Jobsuche"
- "Geburtstag" → Projekt "Soziales"
- "Draftnex", "NexMind" → Projekt "Draftnex"
- "Selbstständigkeit" → Projekt "Selbstständigkeit"

WICHTIG:
- Splitte SINNVOLL (nicht jedes Wort)
- Items aus derselben Eingabe → gleiche groupId
- dueDate als ISO-Format "YYYY-MM-DD" oder relativer Ausdruck wie "morgen", "Freitag"
- Keine Erfindungen, nur was im Text steht

Antworte AUSSCHLIESSLICH mit diesem exakten JSON-Format (kein zusätzlicher Text!):

{
  "items": [
    {
      "type": "task",
      "content": "Beschreibung der Aufgabe/des Eintrags",
      "category": "task|event|idea|info|person",
      "groupId": "g1",
      "dueDate": "2025-02-01" oder "morgen" oder null,
      "priority": "low|medium|high",
      "entities": {
        "persons": ["Name1", "Name2"],
        "places": ["Ort1"],
        "projects": ["Projekt1"],
        "topics": ["Thema1", "Thema2"]
      },
      "reasoning": "Kurze Erklärung warum diese Kategorie/Priorität"
    }
  ],
  "contextSummary": "Zusammenfassung der Eingabe in 1 Satz",
  "globalTopics": ["Übergeordnete Themen"],
  "globalEntities": {
    "persons": ["Alle Personen"],
    "places": ["Alle Orte"],
    "projects": ["Alle Projekte"],
    "topics": ["Alle Themen"]
  }
}

Heutiges Datum: ${todayISO}

BEISPIELE:

Input: "Morgen muss die Miete überwiesen sein, außerdem sollte ich Tobi zum Geburtstag morgen schreiben."

Output:
{
  "items": [
    {
      "type": "task",
      "content": "Miete überweisen",
      "category": "task",
      "groupId": "g1",
      "dueDate": "morgen",
      "priority": "high",
      "entities": {
        "persons": [],
        "places": [],
        "projects": ["Finanzen"],
        "topics": ["Finanzen", "Verwaltung"]
      },
      "reasoning": "Muss-Formulierung deutet auf hohe Priorität"
    },
    {
      "type": "task",
      "content": "Tobi zum Geburtstag schreiben",
      "category": "task",
      "groupId": "g1",
      "dueDate": "morgen",
      "priority": "medium",
      "entities": {
        "persons": ["Tobi"],
        "places": [],
        "projects": ["Soziales"],
        "topics": ["Geburtstag", "Soziales"]
      },
      "reasoning": "Sollte-Formulierung, soziale Verpflichtung"
    }
  ],
  "contextSummary": "Zwei Aufgaben für morgen: Finanzielle Verpflichtung und soziale Geste",
  "globalTopics": ["Finanzen", "Soziales"],
  "globalEntities": {
    "persons": ["Tobi"],
    "places": [],
    "projects": ["Finanzen", "Soziales"],
    "topics": ["Finanzen", "Geburtstag", "Soziales"]
  }
}`
          },
          {
            role: "user",
            content: `Analysiere folgenden Text:\n\n"${text}"`
          }
        ],
        temperature: 0.2,
        max_tokens: 1500,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content in API response");
    }

    // Parse JSON response
    const aiResult = JSON.parse(content);

    // Generate groupId if not provided
    const groupId = generateGroupId();

    // Process items
    const items: NlpItem[] = aiResult.items.map((item: any) => ({
      id: generateItemId(),
      type: item.type || "info",
      content: item.content || text,
      category: item.category || "info",
      groupId: item.groupId || groupId,
      dueDate: parseRelativeDate(item.dueDate),
      priority: item.priority || (item.category === "task" ? "medium" : undefined),
      entities: {
        persons: item.entities?.persons || [],
        places: item.entities?.places || [],
        projects: item.entities?.projects || [],
        topics: item.entities?.topics || [],
      },
      reasoning: item.reasoning || "KI-Analyse",
    }));

    const result: NlpAnalysisResult = {
      items,
      contextSummary: aiResult.contextSummary,
      globalTopics: aiResult.globalTopics || [],
      globalEntities: aiResult.globalEntities || {
        persons: [],
        places: [],
        projects: [],
        topics: [],
      },
    };

    console.log("🧠 NLP Pipeline Analysis:", result);

    return result;

  } catch (error) {
    console.warn("⚠️ NLP Pipeline failed, using fallback:", error);
    return fallbackAnalysis(text);
  }
}

/**
 * Fallback analysis when API is unavailable
 */
function fallbackAnalysis(text: string): NlpAnalysisResult {
  console.log("🔄 Using fallback NLP analysis");

  const groupId = generateGroupId();

  // Simple splitting by comma, "und", "außerdem"
  const parts = text.split(/,|\sund\s|\saußerdem\s/).map(p => p.trim()).filter(p => p.length > 3);

  if (parts.length > 1) {
    // Multiple items detected
    const items: NlpItem[] = parts.map(part => {
      const category = mockClassifyNote(part);

      return {
        id: generateItemId(),
        type: category as any,
        content: part,
        category,
        groupId,
        dueDate: extractSimpleDueDate(part),
        priority: extractSimplePriority(part),
        entities: {
          persons: extractSimplePersons(part),
          places: [],
          projects: extractSimpleProjects(part),
          topics: [],
        },
        reasoning: "Fallback: Keyword-basierte Analyse",
      };
    });

    return {
      items,
      contextSummary: `${items.length} Einträge erkannt`,
      globalTopics: [],
      globalEntities: {
        persons: items.flatMap(i => i.entities.persons),
        places: [],
        projects: items.flatMap(i => i.entities.projects),
        topics: [],
      },
    };
  }

  // Single item
  const category = mockClassifyNote(text);

  return {
    items: [{
      id: generateItemId(),
      type: category as any,
      content: text,
      category,
      groupId,
      dueDate: extractSimpleDueDate(text),
      priority: extractSimplePriority(text),
      entities: {
        persons: extractSimplePersons(text),
        places: [],
        projects: extractSimpleProjects(text),
        topics: [],
      },
      reasoning: "Fallback: Einfache Klassifizierung",
    }],
    contextSummary: "Einzelner Eintrag",
    globalTopics: [],
    globalEntities: {
      persons: extractSimplePersons(text),
      places: [],
      projects: extractSimpleProjects(text),
      topics: [],
    },
  };
}

/**
 * Simple date extraction for fallback
 */
function extractSimpleDueDate(text: string): string | null {
  const lower = text.toLowerCase();

  if (lower.includes("morgen")) return parseRelativeDate("morgen");
  if (lower.includes("heute")) return parseRelativeDate("heute");
  if (lower.includes("montag")) return parseRelativeDate("montag");
  if (lower.includes("dienstag")) return parseRelativeDate("dienstag");
  if (lower.includes("mittwoch")) return parseRelativeDate("mittwoch");
  if (lower.includes("donnerstag")) return parseRelativeDate("donnerstag");
  if (lower.includes("freitag")) return parseRelativeDate("freitag");
  if (lower.includes("samstag")) return parseRelativeDate("samstag");
  if (lower.includes("sonntag")) return parseRelativeDate("sonntag");
  if (lower.includes("nächste woche")) return parseRelativeDate("nächste woche");

  return null;
}

/**
 * Simple priority extraction for fallback
 */
function extractSimplePriority(text: string): "low" | "medium" | "high" | undefined {
  const lower = text.toLowerCase();

  if (lower.includes("muss") || lower.includes("dringend") || lower.includes("urgent") || lower.includes("wichtig")) {
    return "high";
  }
  if (lower.includes("sollte") || lower.includes("bald")) {
    return "medium";
  }
  if (lower.includes("könnte") || lower.includes("irgendwann") || lower.includes("später")) {
    return "low";
  }

  return "medium";
}

/**
 * Simple person extraction for fallback
 */
function extractSimplePersons(text: string): string[] {
  const persons: string[] = [];

  // Look for capitalized words that might be names
  const words = text.split(/\s+/);
  for (const word of words) {
    if (/^[A-ZÄÖÜ][a-zäöüß]+$/.test(word) && word.length > 2) {
      // Skip common words
      if (!["Ich", "Du", "Er", "Sie", "Das", "Der", "Die", "Ein", "Eine"].includes(word)) {
        persons.push(word);
      }
    }
  }

  return [...new Set(persons)]; // Remove duplicates
}

/**
 * Simple project extraction for fallback
 */
function extractSimpleProjects(text: string): string[] {
  const lower = text.toLowerCase();
  const projects: string[] = [];

  if (lower.includes("miete") || lower.includes("konto") || lower.includes("überweis")) {
    projects.push("Finanzen");
  }
  if (lower.includes("bewerbung") || lower.includes("job") || lower.includes("stelle")) {
    projects.push("Jobsuche");
  }
  if (lower.includes("geburtstag") || lower.includes("treffen") || lower.includes("freund")) {
    projects.push("Soziales");
  }
  if (lower.includes("draftnex") || lower.includes("nexmind")) {
    projects.push("Draftnex");
  }
  if (lower.includes("selbstständig") || lower.includes("gründ")) {
    projects.push("Selbstständigkeit");
  }

  return [...new Set(projects)];
}
