import { useState, useEffect, useRef } from "react";
import { Send, Sparkles } from "lucide-react";
import { ChatMessage } from "../types/note";
import { generateId } from "../utils/classifyNote";
import {
  generateEmbedding,
  interpretChatCommand,
  getAIChatReplyV2
} from "../services/ai";
import { analyzeUserInput } from "../services/nlpPipeline";
import { addNoteToSupabase } from "../services/notesRepository";
import {
  loadGraph,
  saveGraph,
  addNoteToGraph,
  addEntityNodes,
  addTopicNodes,
} from "../services/graph";
import ChatBubble from "../components/ChatBubble";

interface ChatViewProps {
  userId: string;
}

/**
 * Formats an ISO date string to a readable format
 */
function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Heute";
    if (diffDays === 1) return "Morgen";
    if (diffDays === -1) return "Gestern";
    if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} Tagen`;
    if (diffDays < -1 && diffDays >= -7) return `Vor ${Math.abs(diffDays)} Tagen`;

    return date.toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return isoDate;
  }
}

export default function ChatView({ userId }: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // DO NOT load old messages - start fresh every session
    // This ensures clean state and no confusion with old data

    // Welcome message only if no messages yet
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: generateId(),
        content: "Hallo! Ich bin NexMind. Schreib mir deine Gedanken, Aufgaben oder Ideen – ich organisiere sie automatisch für dich. 🧠✨",
        role: "assistant",
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userContent = input.trim();
    setInput("");
    setIsProcessing(true);

    // User-Nachricht hinzufügen (SESSION ONLY - not persisted)
    const userMessage: ChatMessage = {
      id: generateId(),
      content: userContent,
      role: "user",
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);

    // INTELLIGENCE LAYER V2: Chat mit Command-Interpretation
    try {
      // 1. Interpretiere Kommando
      const command = await interpretChatCommand(userContent);
      console.log("🎯 Command interpreted:", command);

      let noteId: string | undefined;

      // 2. Wenn es eine normale Nachricht ist (keine Query), speichere als Notiz(en)
      if (command.type === "normal") {
        console.log("💬 Chat input received:", userContent);

        // UNIFIED NLP PIPELINE V6: Single AI analysis
        const nlpResult = await analyzeUserInput(userContent);
        console.log(`🎯 Parsed ${nlpResult.items.length} note(s) from NLP`);

        const graph = loadGraph();
        const createdNoteIds: string[] = [];
        let successCount = 0;

        // Process each NLP item
        for (const nlpItem of nlpResult.items) {
          const embedding = await generateEmbedding(nlpItem.content);

          const newNoteId = generateId();

          const newNote = {
            id: newNoteId,
            content: nlpItem.content,
            category: nlpItem.category,
            createdAt: new Date().toISOString(),
            entities: {
              persons: nlpItem.entities.persons,
              places: nlpItem.entities.places,
              projects: nlpItem.entities.projects,
              topics: nlpItem.entities.topics,
            },
            embedding,
            categoryConfidence: 0.9,
            categoryReason: nlpItem.reasoning || "NLP Pipeline",
            // Task-specific fields
            ...(nlpItem.category === "task" ? {
              status: "open" as const,
              priority: nlpItem.priority || "medium",
              dueDate: nlpItem.dueDate || null,
            } : {}),
          };

          // CRITICAL: Write to Supabase and track success
          console.log(`💾 Inserting note "${nlpItem.category}" into Supabase:`, newNote.content.substring(0, 50));
          const success = await addNoteToSupabase(userId, newNote);

          if (success) {
            successCount++;
            createdNoteIds.push(newNoteId);
            console.log(`✅ Note successfully inserted into Supabase: ${newNoteId}`);

            // Update Knowledge Graph only if write succeeded
            addNoteToGraph(newNote, graph);
            addEntityNodes(newNote, graph);
            addTopicNodes(newNote, nlpItem.entities.topics, graph);
          } else {
            console.error(`❌ Failed to insert note into Supabase: ${newNoteId}`);
          }
        }

        saveGraph(graph);

        // CRITICAL: Only proceed if at least ONE note was written successfully
        if (successCount === 0) {
          console.error("❌ CRITICAL: NO notes were written to Supabase!");
          throw new Error("Failed to write any notes to database");
        }

        noteId = createdNoteIds[0];

        console.log(`✅ SUCCESS: ${successCount}/${nlpResult.items.length} note(s) written to Supabase`);
        console.log(`📊 Knowledge Graph updated with ${successCount} note(s)`);

        // 3. Intelligente AI-Antwort generieren
        let replyText: string;

        if (successCount > 1) {
          // Multi-item reply with detailed breakdown
          replyText = `Verstanden! Ich habe ${successCount} Einträge in der Datenbank angelegt:\n\n`;

          nlpResult.items.forEach((item, index) => {
            const emoji = item.category === "task" ? "✅" : item.category === "event" ? "📅" : item.category === "idea" ? "💡" : item.category === "person" ? "👤" : "📝";

            let itemText = `${index + 1}. ${emoji} ${item.content}`;

            // Add details
            const details: string[] = [];
            if (item.dueDate) details.push(`Fällig: ${formatDate(item.dueDate)}`);
            if (item.priority && item.category === "task") details.push(`Priorität: ${item.priority === "high" ? "Hoch" : item.priority === "medium" ? "Mittel" : "Niedrig"}`);
            if (item.entities.persons.length > 0) details.push(`Person: ${item.entities.persons.join(", ")}`);
            if (item.entities.projects.length > 0) details.push(`Projekt: ${item.entities.projects.join(", ")}`);

            if (details.length > 0) {
              itemText += `\n   (${details.join(", ")})`;
            }

            replyText += itemText + "\n\n";
          });

          if (nlpResult.contextSummary) {
            replyText += `💡 ${nlpResult.contextSummary}`;
          }
        } else if (successCount === 1) {
          // Single item - use AI for natural reply
          replyText = await getAIChatReplyV2(
            userContent,
            command,
            nlpResult.items[0].category,
            0.9
          );

          // Add details if available
          const item = nlpResult.items[0];
          const details: string[] = [];
          if (item.dueDate) details.push(`📅 Fällig: ${formatDate(item.dueDate)}`);
          if (item.priority) details.push(`⚡ Priorität: ${item.priority}`);
          if (item.entities.projects.length > 0) details.push(`📁 Projekt: ${item.entities.projects.join(", ")}`);

          if (details.length > 0) {
            replyText += `\n\n${details.join(" • ")}`;
          }

          replyText += `\n\n✅ Gespeichert in Datenbank`;
        } else {
          // Fallback (should not happen due to error check above)
          replyText = "✅ Notiz gespeichert in Datenbank!";
        }

        const assistantMessage: ChatMessage = {
          id: generateId(),
          content: replyText,
          role: "assistant",
          timestamp: new Date().toISOString(),
          noteId,
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Es ist eine Query - gebe intelligente Antwort
        const replyText = await getAIChatReplyV2(
          userContent,
          command,
          "info", // Dummy category für Queries
          1.0
        );

        const assistantMessage: ChatMessage = {
          id: generateId(),
          content: replyText,
          role: "assistant",
          timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("❌ Error processing chat message:", error);

      // Show error message to user
      const errorMessage: ChatMessage = {
        id: generateId(),
        content: `❌ Fehler beim Verarbeiten: ${error instanceof Error ? error.message : "Unbekannter Fehler"}. Bitte versuche es erneut.`,
        role: "assistant",
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-dark-bg">
      {/* Header */}
      <div className="bg-dark-surface border-b border-border-dark px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-display font-bold text-text-primary">Chat</h2>
          <p className="text-sm text-text-secondary mt-1">
            Sprich mit NexMind – deine Nachrichten werden automatisch als Notizen gespeichert
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}

          {isProcessing && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg">
                <Sparkles size={20} className="text-white animate-pulse" />
              </div>
              <div className="flex items-center gap-2 px-5 py-3 bg-dark-elevated border border-border-dark rounded-3xl rounded-bl-none shadow-lg">
                <div className="flex gap-1">
                  <div className="typing-dot w-2 h-2 bg-accent rounded-full" />
                  <div className="typing-dot w-2 h-2 bg-accent rounded-full" />
                  <div className="typing-dot w-2 h-2 bg-accent rounded-full" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-dark-surface border-t border-border-dark px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSend} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Schreib deine Nachricht..."
              disabled={isProcessing}
              className="flex-1 px-5 py-3 rounded-2xl bg-dark-elevated border border-border-dark text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className="btn-primary disabled:opacity-30 disabled:cursor-not-allowed px-6"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
