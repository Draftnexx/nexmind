import { Bot, User, Sparkles } from "lucide-react";
import { ChatMessage } from "../types/note";

interface ChatBubbleProps {
  message: ChatMessage;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} animate-in fade-in slide-in-from-bottom-4 duration-300`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
          isUser
            ? "bg-gradient-to-br from-primary to-primary/80"
            : "bg-gradient-to-br from-accent to-accent/80"
        }`}
      >
        {isUser ? (
          <User size={20} className="text-white" />
        ) : (
          <Sparkles size={20} className="text-white" />
        )}
      </div>

      {/* Message */}
      <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[70%]`}>
        <div
          className={isUser ? "chat-bubble-user" : "chat-bubble-ai"}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
        <span className="text-xs text-text-muted mt-1.5 px-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}
