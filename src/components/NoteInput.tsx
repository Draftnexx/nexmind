import { useState } from "react";
import { Send, Sparkles } from "lucide-react";

interface NoteInputProps {
  onSubmit: (content: string) => void;
  placeholder?: string;
}

export default function NoteInput({
  onSubmit,
  placeholder = "Schreib deine Notiz...",
}: NoteInputProps) {
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content.trim());
      setContent("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-5">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 w-full resize-none input-field min-h-[100px] max-h-[200px]"
            rows={4}
          />
          <Sparkles
            size={16}
            className="absolute top-3 right-3 text-accent opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={!content.trim()}
          className="btn-primary self-end disabled:opacity-30 disabled:cursor-not-allowed h-fit px-5"
        >
          <Send size={20} />
        </button>
      </div>
      <p className="text-xs text-text-muted mt-3 flex items-center gap-2">
        <kbd className="px-2 py-1 bg-dark-elevated border border-border-dark rounded text-xs">Enter</kbd>
        zum Senden •
        <kbd className="px-2 py-1 bg-dark-elevated border border-border-dark rounded text-xs">Shift+Enter</kbd>
        für neue Zeile
      </p>
    </form>
  );
}
