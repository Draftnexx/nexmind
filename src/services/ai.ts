import { NoteCategory, SemanticClassification } from "../types/note";
import { classifyNote as mockClassifyNote } from "../utils/classifyNote";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-70b-versatile";
const API_TIMEOUT = 10000; // 10 seconds

interface ClassificationResult {
  category: NoteCategory;
  confidence: number;
  reasoning?: string;
}

interface EntityExtractionResult {
  persons: string[];
  places: string[];
  projects: string[];
  topics?: string[];
}

interface ExtendedEntityExtractionResult {
  persons: string[];
  places: string[];
  projects: string[];
  topics: string[];
}

/**
 * Überprüft, ob ein gültiger Groq API Key vorhanden ist
 */
function hasGroqApiKey(): boolean {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  return !!apiKey && apiKey !== "your_groq_api_key_here";
}

/**
 * Klassifiziert eine Notiz mit der Groq AI
 * Falls die API nicht verfügbar ist, wird die Mock-KI als Fallback verwendet
 */
export async function classifyNoteAI(text: string): Promise<ClassificationResult> {
  // Fallback auf Mock-KI, wenn kein API-Key vorhanden
  if (!hasGroqApiKey()) {
    console.log("🤖 Using Mock-AI (no API key configured)");
    return {
      category: mockClassifyNote(text),
      confidence: 0.8,
      reasoning: "Keyword-basierte Klassifizierung"
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

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
            content: `Du bist ein intelligenter Assistent, der Notizen kategorisiert.

Kategorien:
- task: Aufgaben, Todos, Dinge die erledigt werden müssen
- event: Termine, Meetings, zeitgebundene Ereignisse
- idea: Ideen, Vorschläge, Brainstorming, kreative Gedanken
- info: Informationen, Fakten, Wissen, allgemeine Notizen
- person: Personenbezogene Notizen, Kontakte, Kommunikation

Antworte IMMER im folgenden JSON-Format:
{
  "category": "task|event|idea|info|person",
  "confidence": 0.0-1.0,
  "reasoning": "Kurze Erklärung in 1-2 Sätzen"
}`
          },
          {
            role: "user",
            content: `Kategorisiere folgende Notiz:\n\n"${text}"`
          }
        ],
        temperature: 0.3,
        max_tokens: 200,
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
    const result = JSON.parse(content);

    // Validiere Kategorie
    const validCategories: NoteCategory[] = ["task", "event", "idea", "info", "person"];
    if (!validCategories.includes(result.category)) {
      throw new Error("Invalid category from API");
    }

    console.log("✨ Groq AI Classification:", result);

    return {
      category: result.category,
      confidence: result.confidence || 0.9,
      reasoning: result.reasoning,
    };

  } catch (error) {
    console.warn("⚠️ Groq API failed, using Mock-AI fallback:", error);

    // Fallback auf Mock-KI
    return {
      category: mockClassifyNote(text),
      confidence: 0.7,
      reasoning: "Fallback: Keyword-basierte Klassifizierung"
    };
  }
}

/**
 * Generiert eine intelligente Chat-Antwort basierend auf der Kategorie
 */
export async function getAIChatReply(
  text: string,
  category: NoteCategory,
  confidence: number
): Promise<string> {
  // Fallback auf einfache Antwort, wenn kein API-Key
  if (!hasGroqApiKey()) {
    return getSimpleChatReply(category);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

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
            content: `Du bist NexMind, ein intelligenter Notiz-Assistent.

Du hilfst dem Nutzer, seine Gedanken zu organisieren. Antworte:
- freundlich und natürlich
- in 1-2 Sätzen
- bestätige die Kategorisierung
- erwähne kurz, warum du diese Kategorie gewählt hast
- verwende passende Emojis

Kategorien:
- task ✅: Aufgaben
- event 📅: Termine
- idea 💡: Ideen
- info 📝: Informationen
- person 👤: Personen`
          },
          {
            role: "user",
            content: `Der Nutzer hat geschrieben: "${text}"

Ich habe das als "${category}" kategorisiert mit ${Math.round(confidence * 100)}% Sicherheit.

Gib eine natürliche Bestätigung zurück.`
          }
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content;

    if (!reply) {
      throw new Error("No content in API response");
    }

    console.log("💬 Groq AI Reply:", reply);
    return reply.trim();

  } catch (error) {
    console.warn("⚠️ Groq AI reply failed, using simple reply:", error);
    return getSimpleChatReply(category);
  }
}

/**
 * Einfache Fallback-Antworten ohne KI
 */
function getSimpleChatReply(category: NoteCategory): string {
  const replies = {
    task: "Verstanden! Ich habe das als Aufgabe gespeichert. ✅",
    event: "Notiert! Ich habe den Termin für dich festgehalten. 📅",
    idea: "Tolle Idee! Ich habe sie gespeichert. 💡",
    info: "Danke für die Info! Habe ich notiert. 📝",
    person: "Kontakt gespeichert! 👤",
  };

  return replies[category];
}

/**
 * INTELLIGENCE LAYER V2: Semantische Klassifizierung mit allen Kategorie-Konfidenzwerten
 */
export async function classifyNoteSemanticV2(text: string): Promise<SemanticClassification> {
  if (!hasGroqApiKey()) {
    // Fallback für Mock-KI
    const category = mockClassifyNote(text);
    const allConfidences = {
      task: category === "task" ? 0.8 : 0.1,
      event: category === "event" ? 0.8 : 0.1,
      idea: category === "idea" ? 0.8 : 0.1,
      info: category === "info" ? 0.8 : 0.1,
      person: category === "person" ? 0.8 : 0.1,
    };

    return {
      category,
      confidence: 0.8,
      reason: "Keyword-basierte Klassifizierung (Mock-KI)",
      allCategoryConfidences: allConfidences,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

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
            content: `Du bist ein hochintelligenter Klassifizierungs-Assistent für Notizen.

Analysiere die Notiz semantisch und gib ALLE Kategorie-Konfidenzwerte zurück.

Kategorien:
- task: Aufgaben, Todos, Dinge die erledigt werden müssen
- event: Termine, Meetings, zeitgebundene Ereignisse
- idea: Ideen, Vorschläge, Brainstorming, kreative Gedanken
- info: Informationen, Fakten, Wissen, allgemeine Notizen
- person: Personenbezogene Notizen, Kontakte, Kommunikation

Antworte IMMER im folgenden JSON-Format:
{
  "task": 0.0-1.0,
  "event": 0.0-1.0,
  "idea": 0.0-1.0,
  "info": 0.0-1.0,
  "person": 0.0-1.0,
  "reason": "Kurze Erklärung warum die höchste Kategorie gewählt wurde"
}

Die Summe aller Konfidenzwerte sollte ungefähr 1.0 ergeben.`
          },
          {
            role: "user",
            content: `Analysiere folgende Notiz:\n\n"${text}"`
          }
        ],
        temperature: 0.2,
        max_tokens: 300,
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

    const result = JSON.parse(content);

    // Finde Kategorie mit höchster Konfidenz
    const categories: NoteCategory[] = ["task", "event", "idea", "info", "person"];
    let highestCategory: NoteCategory = "info";
    let highestConfidence = 0;

    categories.forEach((cat) => {
      if (result[cat] > highestConfidence) {
        highestConfidence = result[cat];
        highestCategory = cat;
      }
    });

    const classification: SemanticClassification = {
      category: highestCategory,
      confidence: highestConfidence,
      reason: result.reason || "AI-basierte semantische Analyse",
      allCategoryConfidences: {
        task: result.task || 0,
        event: result.event || 0,
        idea: result.idea || 0,
        info: result.info || 0,
        person: result.person || 0,
      },
    };

    console.log("🧠 Semantic Classification V2:", classification);
    return classification;

  } catch (error) {
    console.warn("⚠️ Semantic classification failed, using fallback:", error);

    // Fallback
    const category = mockClassifyNote(text);
    const allConfidences = {
      task: category === "task" ? 0.7 : 0.075,
      event: category === "event" ? 0.7 : 0.075,
      idea: category === "idea" ? 0.7 : 0.075,
      info: category === "info" ? 0.7 : 0.075,
      person: category === "person" ? 0.7 : 0.075,
    };

    return {
      category,
      confidence: 0.7,
      reason: "Fallback: Keyword-basierte Klassifizierung",
      allCategoryConfidences: allConfidences,
    };
  }
}

/**
 * INTELLIGENCE LAYER V2: Extrahiert Entitäten (Personen, Orte, Projekte)
 */
export async function extractEntities(text: string): Promise<EntityExtractionResult> {
  if (!hasGroqApiKey()) {
    return { persons: [], places: [], projects: [] };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

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
            content: `Du bist ein Entity-Extraction-Spezialist. Extrahiere folgende Entitäten aus Text:
- persons: Namen von Personen
- places: Orte, Städte, Locations
- projects: Projekt-Namen, Produkt-Namen

Antworte IMMER im JSON-Format:
{
  "persons": ["Name1", "Name2"],
  "places": ["Ort1", "Ort2"],
  "projects": ["Projekt1", "Projekt2"]
}

Wenn keine Entitäten gefunden werden, gib leere Arrays zurück.`
          },
          {
            role: "user",
            content: `Extrahiere Entitäten aus folgendem Text:\n\n"${text}"`
          }
        ],
        temperature: 0.1,
        max_tokens: 300,
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

    const result = JSON.parse(content);

    console.log("🏷️ Entities extracted:", result);

    return {
      persons: result.persons || [],
      places: result.places || [],
      projects: result.projects || [],
    };

  } catch (error) {
    console.warn("⚠️ Entity extraction failed:", error);
    return { persons: [], places: [], projects: [] };
  }
}

/**
 * INTELLIGENCE LAYER V2: Generiert ein Embedding (Vektor) für Text
 * Verwendet eine einfache Hash-basierte Methode als Fallback, wenn keine echte Embedding-API verfügbar ist
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Einfache hash-basierte Embedding-Generierung
  // In einer echten Implementierung würde hier eine Embedding-API wie OpenAI Embeddings verwendet werden

  const words = text.toLowerCase().split(/\s+/);
  const vector = new Array(128).fill(0);

  words.forEach((word, index) => {
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) - hash) + word.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }

    // Distribute across vector
    const position = Math.abs(hash) % vector.length;
    vector[position] += 1 / (index + 1);
  });

  // Normalize vector
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  const normalized = magnitude > 0 ? vector.map(v => v / magnitude) : vector;

  return normalized;
}

/**
 * INTELLIGENCE LAYER V2: Command-Interpretation für Chat
 */
export interface ChatCommand {
  type: "query" | "normal";
  action?: "show_notes" | "show_tasks" | "show_ideas" | "show_events" | "show_persons" | "show_info";
  timeframe?: "today" | "week" | "month" | "all";
  entityFilter?: string;
}

export async function interpretChatCommand(text: string): Promise<ChatCommand> {
  const lowerText = text.toLowerCase();

  // Erkenne Kommando-Patterns
  const isQuery =
    lowerText.includes("zeig") ||
    lowerText.includes("zeige") ||
    lowerText.includes("liste") ||
    lowerText.includes("suche") ||
    lowerText.includes("finde") ||
    lowerText.includes("alle") ||
    lowerText.includes("was ist") ||
    lowerText.includes("welche");

  if (!isQuery) {
    return { type: "normal" };
  }

  // Erkenne Kategorie
  let action: ChatCommand["action"] | undefined;

  if (lowerText.includes("aufgabe") || lowerText.includes("task") || lowerText.includes("todo")) {
    action = "show_tasks";
  } else if (lowerText.includes("idee") || lowerText.includes("idea")) {
    action = "show_ideas";
  } else if (lowerText.includes("termin") || lowerText.includes("event") || lowerText.includes("meeting")) {
    action = "show_events";
  } else if (lowerText.includes("person") || lowerText.includes("kontakt")) {
    action = "show_persons";
  } else if (lowerText.includes("info") || lowerText.includes("notiz")) {
    action = "show_info";
  } else {
    action = "show_notes";
  }

  // Erkenne Zeitrahmen
  let timeframe: ChatCommand["timeframe"] = "all";

  if (lowerText.includes("heute") || lowerText.includes("today")) {
    timeframe = "today";
  } else if (lowerText.includes("woche") || lowerText.includes("week")) {
    timeframe = "week";
  } else if (lowerText.includes("monat") || lowerText.includes("month")) {
    timeframe = "month";
  }

  // Verwende AI für komplexere Command-Interpretation wenn verfügbar
  if (hasGroqApiKey()) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

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
              content: `Du bist ein Command-Interpreter. Analysiere Nutzer-Anfragen und extrahiere strukturierte Informationen.

Antworte im JSON-Format:
{
  "type": "query" | "normal",
  "action": "show_notes" | "show_tasks" | "show_ideas" | "show_events" | "show_persons" | "show_info",
  "timeframe": "today" | "week" | "month" | "all",
  "entityFilter": "optionaler Entity-Name"
}

Beispiele:
- "Zeig mir alle Ideen dieser Woche" → {"type": "query", "action": "show_ideas", "timeframe": "week"}
- "Welche Aufgaben habe ich heute?" → {"type": "query", "action": "show_tasks", "timeframe": "today"}
- "Liste alle Termine" → {"type": "query", "action": "show_events", "timeframe": "all"}`
            },
            {
              role: "user",
              content: `Interpretiere: "${text}"`
            }
          ],
          temperature: 0.1,
          max_tokens: 150,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (content) {
          const aiCommand = JSON.parse(content);
          console.log("🎯 AI Command Interpretation:", aiCommand);
          return aiCommand;
        }
      }
    } catch (error) {
      console.warn("⚠️ AI command interpretation failed, using fallback:", error);
    }
  }

  return {
    type: "query",
    action,
    timeframe,
  };
}

/**
 * INTELLIGENCE LAYER V2: Generiert intelligente Chat-Antwort mit Kontext-Bewusstsein
 */
export async function getAIChatReplyV2(
  text: string,
  command: ChatCommand,
  category: NoteCategory,
  confidence: number
): Promise<string> {
  if (!hasGroqApiKey()) {
    if (command.type === "query") {
      return `Ich habe deine Anfrage verstanden. Hier sind die passenden Notizen für dich! 🔍`;
    }
    return getSimpleChatReply(category);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const systemPrompt = command.type === "query"
      ? `Du bist NexMind, ein intelligenter Notiz-Assistent. Der Nutzer hat eine Suchanfrage gestellt.

Antworte:
- freundlich und hilfreich
- in 1-2 Sätzen
- bestätige, dass du die Anfrage verstanden hast
- verwende passende Emojis

Der Nutzer möchte: ${command.action || "Notizen sehen"} (Zeitraum: ${command.timeframe || "alle"})`
      : `Du bist NexMind, ein intelligenter Notiz-Assistent.

Antworte:
- freundlich und natürlich
- in 1-2 Sätzen
- bestätige die Kategorisierung
- erwähne kurz, warum du diese Kategorie gewählt hast
- verwende passende Emojis

Kategorien:
- task ✅: Aufgaben
- event 📅: Termine
- idea 💡: Ideen
- info 📝: Informationen
- person 👤: Personen`;

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
            content: systemPrompt
          },
          {
            role: "user",
            content: command.type === "query"
              ? `Der Nutzer fragt: "${text}"`
              : `Der Nutzer hat geschrieben: "${text}"\n\nIch habe das als "${category}" kategorisiert mit ${Math.round(confidence * 100)}% Sicherheit.\n\nGib eine natürliche Bestätigung zurück.`
          }
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content;

    if (!reply) {
      throw new Error("No content in API response");
    }

    console.log("💬 AI Chat Reply V2:", reply);
    return reply.trim();

  } catch (error) {
    console.warn("⚠️ AI chat reply failed, using fallback:", error);

    if (command.type === "query") {
      return `Ich habe deine Anfrage verstanden. Hier sind die passenden Notizen! 🔍`;
    }
    return getSimpleChatReply(category);
  }
}

/**
 * INTELLIGENCE LAYER V2: AI-generierter Brain Report
 */
export interface BrainReportInsights {
  weekSummary: string;
  topCategories: Array<{ category: NoteCategory; count: number; insight: string }>;
  topEntities: {
    persons: string[];
    places: string[];
    projects: string[];
  };
  recommendedFocus: string;
  openTasks: string[];
  insights: string[];
}

export async function generateBrainReportInsights(
  notes: any[],
  weekNotes: any[]
): Promise<BrainReportInsights> {
  if (!hasGroqApiKey() || weekNotes.length === 0) {
    return {
      weekSummary: "Du hattest eine produktive Woche! Weiter so!",
      topCategories: [],
      topEntities: { persons: [], places: [], projects: [] },
      recommendedFocus: "Erstelle mehr Notizen, um personalisierte Einblicke zu erhalten.",
      openTasks: [],
      insights: [],
    };
  }

  try {
    // Sammle alle Entitäten
    const allPersons = new Set<string>();
    const allPlaces = new Set<string>();
    const allProjects = new Set<string>();

    weekNotes.forEach((note) => {
      if (note.entities) {
        note.entities.persons?.forEach((p: string) => allPersons.add(p));
        note.entities.places?.forEach((p: string) => allPlaces.add(p));
        note.entities.projects?.forEach((p: string) => allProjects.add(p));
      }
    });

    // Zähle Kategorien
    const categoryCounts: Record<NoteCategory, number> = {
      task: 0,
      event: 0,
      idea: 0,
      info: 0,
      person: 0,
    };

    weekNotes.forEach((note) => {
      if (note.category) {
        categoryCounts[note.category as NoteCategory]++;
      }
    });

    // Erstelle Kontext für AI
    const context = `
Notizen dieser Woche: ${weekNotes.length}
Kategorien: ${JSON.stringify(categoryCounts)}
Personen: ${Array.from(allPersons).join(", ") || "keine"}
Orte: ${Array.from(allPlaces).join(", ") || "keine"}
Projekte: ${Array.from(allProjects).join(", ") || "keine"}

Beispiel-Notizen:
${weekNotes.slice(0, 5).map((n) => `- ${n.content}`).join("\n")}
    `.trim();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT * 2); // Längerer Timeout

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
            content: `Du bist ein intelligenter Analyse-Assistent für NexMind.

Analysiere die Notizen des Nutzers und erstelle einen kurzen, aber wertvollen Wochenbericht.

Antworte IMMER im folgenden JSON-Format:
{
  "weekSummary": "1-2 Sätze Zusammenfassung der Woche",
  "recommendedFocus": "1 Satz: Worauf sollte sich der Nutzer diese Woche konzentrieren?",
  "insights": ["Einsicht 1", "Einsicht 2", "Einsicht 3"],
  "openTasks": ["Task 1", "Task 2"]
}

Sei:
- prägnant und wertvoll
- motivierend aber ehrlich
- fokussiert auf Produktivität
- verwende KEINE Emojis im JSON`
          },
          {
            role: "user",
            content: `Analysiere diese Woche:\n\n${context}`
          }
        ],
        temperature: 0.5,
        max_tokens: 500,
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

    const aiInsights = JSON.parse(content);

    // Erstelle Top-Kategorien mit Insights
    const topCategories = (Object.entries(categoryCounts) as [NoteCategory, number][])
      .filter(([_, count]) => count > 0)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 3)
      .map(([category, count]) => ({
        category,
        count,
        insight: getCategoryInsight(category, count),
      }));

    const result: BrainReportInsights = {
      weekSummary: aiInsights.weekSummary || "Eine produktive Woche!",
      topCategories,
      topEntities: {
        persons: Array.from(allPersons).slice(0, 5),
        places: Array.from(allPlaces).slice(0, 5),
        projects: Array.from(allProjects).slice(0, 5),
      },
      recommendedFocus: aiInsights.recommendedFocus || "Setze klare Prioritäten für die kommende Woche.",
      openTasks: aiInsights.openTasks || [],
      insights: aiInsights.insights || [],
    };

    console.log("🧠 Brain Report Insights generated:", result);
    return result;

  } catch (error) {
    console.warn("⚠️ Brain report generation failed:", error);

    return {
      weekSummary: "Du hattest eine produktive Woche mit vielen Notizen!",
      topCategories: [],
      topEntities: { persons: [], places: [], projects: [] },
      recommendedFocus: "Konzentriere dich auf deine wichtigsten Aufgaben.",
      openTasks: [],
      insights: [
        "Bleib fokussiert auf deine Ziele",
        "Organisiere deine Gedanken regelmäßig",
        "Nutze die Kategorien, um Struktur zu schaffen",
      ],
    };
  }
}

function getCategoryInsight(category: NoteCategory, count: number): string {
  const insights = {
    task: `${count} Aufgaben erfasst - Strukturiertes Arbeiten zahlt sich aus!`,
    event: `${count} Termine geplant - Gutes Zeitmanagement!`,
    idea: `${count} Ideen festgehalten - Kreativität ist deine Stärke!`,
    info: `${count} Infos gespeichert - Wissen ist Macht!`,
    person: `${count} Kontakte dokumentiert - Networking läuft!`,
  };
  return insights[category];
}

/**
 * INTELLIGENCE LAYER V3: Erweiterte Entity Extraction MIT Topics
 */
export async function extractEntitiesWithTopics(text: string): Promise<ExtendedEntityExtractionResult> {
  if (!hasGroqApiKey()) {
    return { persons: [], places: [], projects: [], topics: [] };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

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
            content: `Du bist ein Entity-Extraction-Spezialist für Knowledge Graphs. Extrahiere folgende Entitäten aus Text:

- persons: Namen von Personen
- places: Orte, Städte, Locations
- projects: Projekt-Namen, Produkt-Namen, Firmen
- topics: Themen, Konzepte, Technologien, Kategorien (z.B. "AI", "Marketing", "React", "Fitness", "Finanzplanung")

Antworte IMMER im JSON-Format:
{
  "persons": ["Name1", "Name2"],
  "places": ["Ort1", "Ort2"],
  "projects": ["Projekt1", "Projekt2"],
  "topics": ["Thema1", "Thema2", "Thema3"]
}

Wenn keine Entitäten gefunden werden, gib leere Arrays zurück.
Topics sollten allgemeine Konzepte sein, nicht spezifische Details.`
          },
          {
            role: "user",
            content: `Extrahiere Entitäten und Topics aus folgendem Text:\n\n"${text}"`
          }
        ],
        temperature: 0.1,
        max_tokens: 400,
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

    const result = JSON.parse(content);

    console.log("🏷️ Extended Entities extracted:", result);

    return {
      persons: result.persons || [],
      places: result.places || [],
      projects: result.projects || [],
      topics: result.topics || [],
    };

  } catch (error) {
    console.warn("⚠️ Extended entity extraction failed:", error);
    return { persons: [], places: [], projects: [], topics: [] };
  }
}
