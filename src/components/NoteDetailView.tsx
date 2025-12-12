import { useState, useEffect } from "react";
import { Note, TaskStatus, TaskPriority } from "../types/note";
import { updateNoteInSupabase } from "../services/notesRepository";
import {
  CheckSquare,
  Calendar,
  Lightbulb,
  FileText,
  User,
  Clock,
  Flag,
  MapPin,
  Briefcase,
  Tag,
  X
} from "lucide-react";

interface NoteDetailViewProps {
  note: Note;
  userId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function NoteDetailView({ note, userId, onClose, onUpdate }: NoteDetailViewProps) {
  const [content, setContent] = useState(note.content);
  const [status, setStatus] = useState<TaskStatus>(note.status || "open");
  const [priority, setPriority] = useState<TaskPriority>(note.priority || "medium");
  const [dueDate, setDueDate] = useState(note.dueDate || "");
  const [isSaving, setIsSaving] = useState(false);

  // Auto-save when content changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content !== note.content) {
        handleSave();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [content]);

  const handleSave = async () => {
    setIsSaving(true);

    const updatedNote: Partial<Note> & { id: string } = {
      id: note.id,
      content,
      category: note.category,
      entities: note.entities,
      embedding: note.embedding,
      categoryConfidence: note.categoryConfidence,
      categoryReason: note.categoryReason,
    };

    // Add task-specific fields
    if (note.category === "task") {
      updatedNote.status = status;
      updatedNote.priority = priority;
      updatedNote.dueDate = dueDate || null;
    }

    await updateNoteInSupabase(userId, updatedNote);
    onUpdate();
    setIsSaving(false);
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    setStatus(newStatus);
    const updatedNote: Partial<Note> & { id: string } = {
      id: note.id,
      content,
      category: note.category,
      status: newStatus,
      priority,
      dueDate: dueDate || null,
    };
    await updateNoteInSupabase(userId, updatedNote);
    onUpdate();
  };

  const handlePriorityChange = async (newPriority: TaskPriority) => {
    setPriority(newPriority);
    const updatedNote: Partial<Note> & { id: string } = {
      id: note.id,
      content,
      category: note.category,
      status,
      priority: newPriority,
      dueDate: dueDate || null,
    };
    await updateNoteInSupabase(userId, updatedNote);
    onUpdate();
  };

  const handleDueDateChange = async (newDueDate: string) => {
    setDueDate(newDueDate);
    const updatedNote: Partial<Note> & { id: string } = {
      id: note.id,
      content,
      category: note.category,
      status,
      priority,
      dueDate: newDueDate || null,
    };
    await updateNoteInSupabase(userId, updatedNote);
    onUpdate();
  };

  const getCategoryIcon = () => {
    switch (note.category) {
      case "task": return <CheckSquare size={24} className="text-blue-500" />;
      case "event": return <Calendar size={24} className="text-purple-500" />;
      case "idea": return <Lightbulb size={24} className="text-yellow-500" />;
      case "info": return <FileText size={24} className="text-green-500" />;
      case "person": return <User size={24} className="text-pink-500" />;
    }
  };

  const getCategoryLabel = () => {
    switch (note.category) {
      case "task": return "Aufgabe";
      case "event": return "Termin";
      case "idea": return "Idee";
      case "info": return "Info";
      case "person": return "Person";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <div className="h-full flex flex-col bg-dark-surface border-l border-border-dark">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-dark">
        <div className="flex items-center gap-3">
          {getCategoryIcon()}
          <div>
            <h2 className="text-lg font-display font-semibold text-text-primary">
              {getCategoryLabel()}
            </h2>
            <p className="text-xs text-text-muted">
              {formatDate(note.createdAt)}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-dark-elevated rounded-lg transition-colors"
        >
          <X size={20} className="text-text-muted" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Main Content */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Inhalt
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[200px] px-4 py-3 rounded-xl bg-dark-elevated border border-border-dark text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            placeholder="Notizinhalt..."
          />
          {isSaving && (
            <p className="text-xs text-accent mt-2">Speichert...</p>
          )}
        </div>

        {/* Task-specific fields */}
        {note.category === "task" && (
          <>
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Status
              </label>
              <div className="flex gap-2">
                {(["open", "in_progress", "done"] as TaskStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      status === s
                        ? "bg-primary text-white"
                        : "bg-dark-elevated text-text-secondary hover:bg-dark-bg"
                    }`}
                  >
                    {s === "open" ? "Offen" : s === "in_progress" ? "In Bearbeitung" : "Erledigt"}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2 flex items-center gap-2">
                <Flag size={16} />
                Priorität
              </label>
              <div className="flex gap-2">
                {(["low", "medium", "high"] as TaskPriority[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePriorityChange(p)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      priority === p
                        ? p === "high"
                          ? "bg-red-500 text-white"
                          : p === "medium"
                          ? "bg-yellow-500 text-white"
                          : "bg-green-500 text-white"
                        : "bg-dark-elevated text-text-secondary hover:bg-dark-bg"
                    }`}
                  >
                    {p === "low" ? "Niedrig" : p === "medium" ? "Mittel" : "Hoch"}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2 flex items-center gap-2">
                <Clock size={16} />
                Fälligkeitsdatum
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => handleDueDateChange(e.target.value)}
                className="px-4 py-2 rounded-xl bg-dark-elevated border border-border-dark text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </>
        )}

        {/* Event-specific fields */}
        {note.category === "event" && note.dueDate && (
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2 flex items-center gap-2">
              <Calendar size={16} />
              Datum
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => handleDueDateChange(e.target.value)}
              className="px-4 py-2 rounded-xl bg-dark-elevated border border-border-dark text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        )}

        {/* Entities */}
        {note.entities && (
          <div className="space-y-4 pt-4 border-t border-border-dark">
            <h3 className="text-sm font-semibold text-text-primary">Verknüpfungen</h3>

            {note.entities.persons && note.entities.persons.length > 0 && (
              <div>
                <label className="flex items-center gap-2 text-xs text-text-muted mb-2">
                  <User size={14} />
                  Personen
                </label>
                <div className="flex flex-wrap gap-2">
                  {note.entities.persons.map((person, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 text-xs border border-pink-500/20"
                    >
                      {person}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {note.entities.projects && note.entities.projects.length > 0 && (
              <div>
                <label className="flex items-center gap-2 text-xs text-text-muted mb-2">
                  <Briefcase size={14} />
                  Projekte
                </label>
                <div className="flex flex-wrap gap-2">
                  {note.entities.projects.map((project, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20"
                    >
                      {project}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {note.entities.places && note.entities.places.length > 0 && (
              <div>
                <label className="flex items-center gap-2 text-xs text-text-muted mb-2">
                  <MapPin size={14} />
                  Orte
                </label>
                <div className="flex flex-wrap gap-2">
                  {note.entities.places.map((place, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs border border-green-500/20"
                    >
                      {place}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {note.entities.topics && note.entities.topics.length > 0 && (
              <div>
                <label className="flex items-center gap-2 text-xs text-text-muted mb-2">
                  <Tag size={14} />
                  Themen
                </label>
                <div className="flex flex-wrap gap-2">
                  {note.entities.topics.map((topic, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs border border-purple-500/20"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Metadata */}
        {note.categoryReason && (
          <div className="pt-4 border-t border-border-dark">
            <h3 className="text-sm font-semibold text-text-primary mb-2">KI-Analyse</h3>
            <p className="text-xs text-text-muted italic">
              {note.categoryReason}
            </p>
            {note.categoryConfidence && (
              <p className="text-xs text-text-muted mt-1">
                Konfidenz: {Math.round(note.categoryConfidence * 100)}%
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
