import { useState, useEffect } from "react";
import { Search, Sparkles, Zap, Network } from "lucide-react";
import { Note, NoteCategory } from "../types/note";
import { loadNotes, addNote, deleteNote } from "../storage/localStorage";
import { generateId } from "../utils/classifyNote";
import { analyzeUserInput } from "../services/nlpPipeline";
import { generateEmbedding } from "../services/ai";
import { findSimilarNotes } from "../services/embeddings";
import {
  loadGraph,
  saveGraph,
  addNoteToGraph,
  addEntityNodes,
  addTopicNodes,
  addSimilarityEdges,
  findSimilarNotesFromGraph,
} from "../services/graph";
import NoteItem from "../components/NoteItem";
import NoteInput from "../components/NoteInput";
import {
  fetchNotesFromSupabase,
  addNoteToSupabase,
  deleteNoteFromSupabase
} from "../services/notesRepository";

interface NotesViewProps {
  selectedCategory: NoteCategory | "all";
  userId: string;
}

export default function NotesView({ selectedCategory, userId }: NotesViewProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isClassifying, setIsClassifying] = useState(false);

  // READ-ONLY: Load notes from Supabase on mount
  useEffect(() => {
    const loadNotesFromSupabase = async () => {
      console.log(`📖 Loading notes from Supabase for user: ${userId}...`);
      const supabaseNotes = await fetchNotesFromSupabase(userId);
      setNotes(supabaseNotes);

      // DEACTIVATED: localStorage read (kept for future migration)
      // setNotes(loadNotes());
    };

    loadNotesFromSupabase();
  }, [userId]);

  const handleAddNote = async (content: string) => {
    setIsClassifying(true);

    try {
      // UNIFIED NLP PIPELINE V6: Single AI analysis for everything
      console.log("🧠 Running unified NLP pipeline...");
      const nlpResult = await analyzeUserInput(content);

      console.log(`🎯 NLP Analysis: ${nlpResult.items.length} items detected`);

      if (nlpResult.items.length > 1) {
        console.log(`✂️ Input split into ${nlpResult.items.length} separate notes`);
      }

      const graph = loadGraph();

      // Process each NLP item
      for (const nlpItem of nlpResult.items) {
        // Generate embedding for semantic search
        const embedding = await generateEmbedding(nlpItem.content);

        // Create Note from NlpItem
        const newNote: Note = {
          id: generateId(),
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
          categoryConfidence: 0.9, // NLP pipeline is high confidence
          categoryReason: nlpItem.reasoning || "NLP Pipeline Analysis",
          // Task-specific fields
          ...(nlpItem.category === "task" ? {
            status: "open" as const,
            priority: nlpItem.priority || "medium",
            dueDate: nlpItem.dueDate || null,
          } : {}),
        };

        // SUPABASE: Write to Supabase instead of localStorage
        const success = await addNoteToSupabase(userId, newNote);

        if (success) {
          // Update Knowledge Graph only if write succeeded
          addNoteToGraph(newNote, graph);
          addEntityNodes(newNote, graph);
          addTopicNodes(newNote, nlpItem.entities.topics, graph);

          console.log(`✨ Created note: "${nlpItem.category}" - ${nlpItem.content.substring(0, 50)}...`);
          if (nlpItem.dueDate) {
            console.log(`   📅 Due: ${nlpItem.dueDate}`);
          }
          if (nlpItem.priority) {
            console.log(`   ⚡ Priority: ${nlpItem.priority}`);
          }
          if (nlpItem.entities.persons.length > 0) {
            console.log(`   👤 Persons: ${nlpItem.entities.persons.join(", ")}`);
          }
          if (nlpItem.entities.projects.length > 0) {
            console.log(`   📁 Projects: ${nlpItem.entities.projects.join(", ")}`);
          }
        }
      }

      // Save graph once after all notes
      saveGraph(graph);

      // SUPABASE: Reload notes from Supabase
      const updatedNotes = await fetchNotesFromSupabase(userId);
      setNotes(updatedNotes);

      console.log(`📊 Knowledge Graph updated with ${nlpResult.items.length} notes`);
      if (nlpResult.contextSummary) {
        console.log(`📝 Context: ${nlpResult.contextSummary}`);
      }
    } catch (error) {
      console.error("Error in NLP pipeline:", error);

      // Fallback: create simple info note
      const simpleNote: Note = {
        id: generateId(),
        content,
        category: "info",
        createdAt: new Date().toISOString(),
        entities: { persons: [], places: [], projects: [], topics: [] },
        categoryConfidence: 0.5,
        categoryReason: "Fallback due to error",
      };

      // SUPABASE: Write fallback note to Supabase
      await addNoteToSupabase(userId, simpleNote);
      const updatedNotes = await fetchNotesFromSupabase(userId);
      setNotes(updatedNotes);
    } finally {
      setIsClassifying(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    // SUPABASE: Delete from Supabase instead of localStorage
    const success = await deleteNoteFromSupabase(userId, id);

    if (success) {
      // Reload notes from Supabase
      const updatedNotes = await fetchNotesFromSupabase(userId);
      setNotes(updatedNotes);
    }
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
    <div className="flex-1 flex flex-col h-screen bg-dark-bg">
      {/* Header */}
      <div className="bg-dark-surface border-b border-border-dark px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-display font-bold text-text-primary">
                Notizen
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                {filteredNotes.length} {filteredNotes.length === 1 ? "Notiz" : "Notizen"}
              </p>
            </div>
            {isClassifying && (
              <div className="flex items-center gap-2 text-accent">
                <Zap size={20} className="animate-pulse" />
                <Sparkles size={18} className="animate-spin" />
                <span className="text-sm font-medium">KI analysiert...</span>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Notizen durchsuchen..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-dark-elevated border border-border-dark text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-dark-elevated border border-border-dark mb-6">
                <Sparkles size={32} className="text-accent" />
              </div>
              <h3 className="text-xl font-display font-semibold text-text-primary mb-2">
                Keine Notizen gefunden
              </h3>
              <p className="text-text-secondary">
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
