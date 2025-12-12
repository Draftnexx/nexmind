import { Trash2 } from "lucide-react";
import { Note } from "../types/note";
import CategoryBadge from "./CategoryBadge";

interface NoteItemProps {
  note: Note;
  onDelete: (id: string) => void;
  onClick?: () => void;
  isSelected?: boolean;
}

export default function NoteItem({ note, onDelete, onClick, isSelected }: NoteItemProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Gerade eben";
    if (diffMins < 60) return `vor ${diffMins} Min.`;
    if (diffHours < 24) return `vor ${diffHours} Std.`;
    if (diffDays < 7) return `vor ${diffDays} Tag${diffDays > 1 ? "en" : ""}`;

    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div
      onClick={onClick}
      className={`note-card group cursor-pointer transition-all ${
        isSelected
          ? "ring-2 ring-primary bg-primary/5"
          : "hover:bg-dark-elevated hover:border-border-light"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <CategoryBadge category={note.category} />
            <span className="text-xs text-text-muted">
              {formatDate(note.createdAt)}
            </span>
          </div>
          <p className="text-text-primary text-sm leading-relaxed whitespace-pre-wrap break-words line-clamp-3">
            {note.content}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note.id);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-500/20 rounded-lg text-text-muted hover:text-red-400"
          title="Notiz löschen"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
