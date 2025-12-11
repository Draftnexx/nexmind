import { useState, useEffect, useRef } from "react";
import { Send, Sparkles } from "lucide-react";
import { ChatMessage } from "../types/note";
import { loadChatMessages, addChatMessage, addNote } from "../storage/localStorage";
import { generateId } from "../utils/classifyNote";
import {
  classifyNoteSemanticV2,
  extractEntitiesWithTopics,
  generateEmbedding,
  interpretChatCommand,
  getAIChatReplyV2
} from "../services/ai";
import {
  loadGraph,
  saveGraph,
  addNoteToGraph,
  addEntityNodes,
  addTopicNodes,
  addSimilarityEdges,
} from "../services/graph";
import { loadNotes } from "../storage/localStorage";
import ChatBubble from "../components/ChatBubble";

export default function ChatView() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadedMessages = loadChatMessages();

    // Begrüßungsnachricht wenn Chat leer ist
    if (loadedMessages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: generateId(),
        content: "Hallo! Ich bin NexMind. Schreib mir deine Gedanken, Aufgaben oder Ideen – ich organisiere sie automatisch für dich. 🧠✨",
        role: "assistant",
        timestamp: new Date().toISOString(),
      };
      addChatMessage(welcomeMessage);
      setMessages([welcomeMessage]);
    } else {
      setMessages(loadedMessages);
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

    // User-Nachricht hinzufügen
    const userMessage: ChatMessage = {
      id: generateId(),
      content: userContent,
      role: "user",
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = addChatMessage(userMessage);
    setMessages([...updatedMessages]);

    // INTELLIGENCE LAYER V2: Chat mit Command-Interpretation
    try {
      // 1. Interpretiere Kommando
      const command = await interpretChatCommand(userContent);
      console.log("🎯 Command interpreted:", command);

      let noteId: string | undefined;

      // 2. Wenn es eine normale Nachricht ist (keine Query), speichere als Notiz
      if (command.type === "normal") {
        // Klassifizieren mit AI (V2)
        const classification = await classifyNoteSemanticV2(userContent);

        // INTELLIGENCE LAYER V3: Extended Entity Extraction WITH Topics
        const extendedEntities = await extractEntitiesWithTopics(userContent);

        // Generate Embedding
        const embedding = await generateEmbedding(userContent);

        noteId = generateId();

        // Notiz speichern
        const newNote = {
          id: noteId,
          content: userContent,
          category: classification.category,
          createdAt: new Date().toISOString(),
          entities: {
            persons: extendedEntities.persons,
            places: extendedEntities.places,
            projects: extendedEntities.projects,
            topics: extendedEntities.topics,
          },
          embedding,
          categoryConfidence: classification.confidence,
          categoryReason: classification.reason,
        };

        addNote(newNote);

        // INTELLIGENCE LAYER V3: Update Knowledge Graph
        const graph = loadGraph();
        const allNotes = loadNotes();

        addNoteToGraph(newNote, graph);
        addEntityNodes(newNote, graph);
        addTopicNodes(newNote, extendedEntities.topics, graph);
        addSimilarityEdges(newNote, allNotes, graph);

        saveGraph(graph);

        console.log(`✨ Chat message classified as "${classification.category}" with ${Math.round(classification.confidence * 100)}% confidence`);
        console.log(`🏷️ Extended Entities:`, extendedEntities);
        console.log(`📊 Knowledge Graph updated from Chat`);

        // 3. Intelligente AI-Antwort generieren (V2)
        const replyText = await getAIChatReplyV2(
          userContent,
          command,
          classification.category,
          classification.confidence
        );

        const assistantMessage: ChatMessage = {
          id: generateId(),
          content: replyText,
          role: "assistant",
          timestamp: new Date().toISOString(),
          noteId,
        };

        const finalMessages = addChatMessage(assistantMessage);
        setMessages([...finalMessages]);
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

        const finalMessages = addChatMessage(assistantMessage);
        setMessages([...finalMessages]);
      }
    } catch (error) {
      console.error("Error processing chat message:", error);
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
