import { useState, useEffect } from "react";
import { Search, Sparkles } from "lucide-react";
import { Note, NoteCategory } from "../types/note";
import { loadNotes, addNote, deleteNote, searchNotes } from "../storage/localStorage";
import { classifyNote, generateId } from "../utils/classifyNote";
import NoteItem from "../components/NoteItem";
import NoteInput from "../components/NoteInput";

interface NotesViewProps {
  selectedCategory: NoteCategory | "all";
}

export default function NotesView({ selectedCategory }: NotesViewProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isClassifying, setIsClassifying] = useState(false);

  useEffect(() => {
    setNotes(loadNotes());
  }, []);

  const handleAddNote = (content: string) => {
    setIsClassifying(true);

    // Simuliere KI-Klassifizierung mit kleiner Verzögerung
    setTimeout(() => {
      const category = classifyNote(content);
      const newNote: Note = {
        id: generateId(),
        content,
        category,
        createdAt: new Date().toISOString(),
      };

      const updatedNotes = addNote(newNote);
      setNotes(updatedNotes);
      setIsClassifying(false);
    }, 500);
  };

  const handleDeleteNote = (id: string) => {
    const updatedNotes = deleteNote(id);
    setNotes(updatedNotes);
  };

  // Filter notes
  const filteredNotes = notes.filter((note) => {
    // Category filter
    if (selectedCategory !== "all" && note.category !== selectedCategory) {
      return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      return note.content.toLowerCase().includes(searchQuery.toLowerCase());
    }

    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-900">
                Notizen
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {filteredNotes.length} {filteredNotes.length === 1 ? "Notiz" : "Notizen"}
              </p>
            </div>
            {isClassifying && (
              <div className="flex items-center gap-2 text-accent">
                <Sparkles size={20} className="animate-pulse" />
                <span className="text-sm font-medium">KI klassifiziert...</span>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Notizen durchsuchen..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Input */}
          <NoteInput onSubmit={handleAddNote} />

          {/* Notes */}
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Sparkles size={28} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Keine Notizen gefunden
              </h3>
              <p className="text-gray-500">
                {searchQuery
                  ? "Versuche einen anderen Suchbegriff"
                  : "Erstelle deine erste Notiz oben"}
              </p>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <NoteItem key={note.id} note={note} onDelete={handleDeleteNote} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
