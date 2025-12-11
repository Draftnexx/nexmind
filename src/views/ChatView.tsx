import { useState, useEffect, useRef } from "react";
import { Send, Sparkles } from "lucide-react";
import { ChatMessage, NoteCategory } from "../types/note";
import { loadChatMessages, addChatMessage, addNote } from "../storage/localStorage";
import { classifyNote, generateId } from "../utils/classifyNote";
import ChatBubble from "../components/ChatBubble";

/**
 * Generiert KI-Antwort basierend auf der erkannten Kategorie
 */
function getAiReplyText(category: NoteCategory): string {
  const categoryLabels = {
    task: "Aufgabe",
    event: "Termin",
    idea: "Idee",
    info: "Info",
    person: "Person",
  };

  const responses = {
    task: "Verstanden! Ich habe das als Aufgabe gespeichert. ✅",
    event: "Notiert! Ich habe den Termin für dich festgehalten. 📅",
    idea: "Tolle Idee! Ich habe sie gespeichert. 💡",
    info: "Danke für die Info! Habe ich notiert. 📝",
    person: "Kontakt gespeichert! 👤",
  };

  return `${responses[category]} Kategorisiert als: ${categoryLabels[category]}`;
}

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

    // Simuliere KI-Verarbeitung
    setTimeout(() => {
      // Notiz erstellen und klassifizieren
      const category = classifyNote(userContent);
      const noteId = generateId();

      addNote({
        id: noteId,
        content: userContent,
        category,
        createdAt: new Date().toISOString(),
      });

      // KI-Antwort generieren
      const replyText = getAiReplyText(category);

      const assistantMessage: ChatMessage = {
        id: generateId(),
        content: replyText,
        role: "assistant",
        timestamp: new Date().toISOString(),
        noteId,
      };

      const finalMessages = addChatMessage(assistantMessage);
      setMessages([...finalMessages]);
      setIsProcessing(false);
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-display font-bold text-gray-900">Chat</h2>
          <p className="text-sm text-gray-500 mt-1">
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
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                <Sparkles size={18} className="text-white animate-pulse" />
              </div>
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-2xl rounded-tl-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSend} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Schreib deine Nachricht..."
              disabled={isProcessing}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
