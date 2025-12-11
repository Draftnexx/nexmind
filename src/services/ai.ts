import { NoteCategory } from "../types/note";
import { classifyNote as mockClassifyNote } from "../utils/classifyNote";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-70b-versatile";
const API_TIMEOUT = 10000; // 10 seconds

interface ClassificationResult {
  category: NoteCategory;
  confidence: number;
  reasoning?: string;
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
