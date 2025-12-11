import { useState, useEffect } from "react";
import { Search, Sparkles, Zap, Network } from "lucide-react";
import { Note, NoteCategory } from "../types/note";
import { loadNotes, addNote, deleteNote } from "../storage/localStorage";
import { generateId } from "../utils/classifyNote";
import { analyzeComplexInput, extractEntitiesWithTopics, generateEmbedding, analyzeTaskMeta } from "../services/ai";
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

  const handleAddNote = async (content: string) => {
    setIsClassifying(true);

    try {
      // MULTI-INTENT PARSER: Analyze and potentially split into multiple notes
      const multiIntentResult = await analyzeComplexInput(content);

      console.log(`🎯 Multi-Intent Analysis: ${multiIntentResult.items.length} items detected`);

      if (multiIntentResult.originalHadMultipleIntents) {
        console.log(`✂️ Input was split into ${multiIntentResult.items.length} separate notes`);
      }

      let updatedNotes = loadNotes();
      const graph = loadGraph();

      // Process each detected intent/item
      for (const item of multiIntentResult.items) {
        // INTELLIGENCE LAYER V3: Extended Entity Extraction WITH Topics
        const extendedEntities = await extractEntitiesWithTopics(item.content);

        // INTELLIGENCE LAYER V2: Generate Embedding
        const embedding = await generateEmbedding(item.content);

        // PRODUCTIVITY INTELLIGENCE V4: Task meta (priority/dueDate)
        let taskFields = {};
        if (item.category === "task") {
          if (item.priority || item.dueDate) {
            // Already analyzed by multi-intent parser
            taskFields = {
              status: "open",
              priority: item.priority || "medium",
              dueDate: item.dueDate || null,
            };
          } else {
            // Fallback: analyze separately
            const taskMeta = await analyzeTaskMeta(item.content);
            taskFields = {
              status: "open",
              priority: taskMeta.priority,
              dueDate: taskMeta.dueDate,
            };
          }
        }

        const newNote: Note = {
          id: generateId(),
          content: item.content,
          category: item.category,
          createdAt: new Date().toISOString(),
          entities: {
            persons: extendedEntities.persons,
            places: extendedEntities.places,
            projects: extendedEntities.projects,
            topics: extendedEntities.topics,
          },
          embedding,
          categoryConfidence: item.confidence,
          categoryReason: item.reasoning,
          ...taskFields,
        };

        updatedNotes = addNote(newNote);

        // INTELLIGENCE LAYER V3: Update Knowledge Graph
        addNoteToGraph(newNote, graph);
        addEntityNodes(newNote, graph);
        addTopicNodes(newNote, extendedEntities.topics, graph);
        addSimilarityEdges(newNote, updatedNotes, graph);

        console.log(`✨ Created note: "${item.category}" - ${item.content.substring(0, 50)}...`);
      }

      // Save graph once after all notes
      saveGraph(graph);

      // Update UI
      setNotes(updatedNotes);

      console.log(`📊 Knowledge Graph updated with ${multiIntentResult.items.length} notes`);
    } catch (error) {
      console.error("Error adding note:", error);
    } finally {
      setIsClassifying(false);
    }
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
