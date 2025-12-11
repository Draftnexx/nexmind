import { useState } from "react";
import { Send } from "lucide-react";

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
    <form onSubmit={handleSubmit} className="card p-4">
      <div className="flex gap-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 resize-none input-field min-h-[80px] max-h-[200px]"
          rows={3}
        />
        <button
          type="submit"
          disabled={!content.trim()}
          className="btn-primary self-end disabled:opacity-50 disabled:cursor-not-allowed h-fit"
        >
          <Send size={20} />
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd> zum
        Senden • <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Shift+Enter</kbd> für
        neue Zeile
      </p>
    </form>
  );
}
