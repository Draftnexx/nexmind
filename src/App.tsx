import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import NotesView from "./views/NotesView";
import ChatView from "./views/ChatView";
import BrainReportView from "./views/BrainReportView";
import GraphView from "./views/GraphView";
import TaskDashboardView from "./views/TaskDashboardView";
import AISuggestionsView from "./views/AISuggestionsView";
import { NoteCategory } from "./types/note";
import { loadNotes } from "./storage/localStorage";
import { loadGraph, saveGraph, buildGraphFromNotes } from "./services/graph";
import { generateProactiveSuggestions } from "./services/automation";
import { addAISuggestion } from "./storage/localStorage";
import { supabase } from "./lib/supabaseClient";

type View = "notes" | "chat" | "brain" | "graph" | "tasks" | "ai";

function App() {
  const [activeView, setActiveView] = useState<View>("notes");
  const [selectedCategory, setSelectedCategory] = useState<NoteCategory | "all">("all");
  const [isInitializing, setIsInitializing] = useState(true);
  const [categoryCounts, setCategoryCounts] = useState<Record<NoteCategory | "all", number>>({
    all: 0,
    task: 0,
    event: 0,
    idea: 0,
    info: 0,
    person: 0,
  });

  // INTELLIGENCE SYSTEM INITIALIZATION
  useEffect(() => {
    const initializeIntelligenceSystem = async () => {
      console.log("🚀 Initializing NexMind Intelligence System...");

      try {
        // 0. Supabase Connection Test
        console.log("🔌 Testing Supabase connection...");
        const { data, error } = await supabase
          .from("notes")
          .select("*")
          .limit(1);

        if (error) {
          console.error("❌ Supabase connection error:", error.message);
        } else {
          console.log("✅ Supabase connected successfully");
          if (data && data.length > 0) {
            console.log(`📊 Found ${data.length} note(s) in Supabase`);
          }
        }

        // 1. Initialize Knowledge Graph if empty or outdated
        const graph = loadGraph();
        const notes = loadNotes();

        if (graph.nodes.length === 0 && notes.length > 0) {
          console.log("📊 Building Knowledge Graph from existing notes...");

          // Extract topics from existing notes
          const topicsMap = new Map<string, string[]>();
          notes.forEach(note => {
            if (note.entities?.topics) {
              topicsMap.set(note.id, note.entities.topics);
            }
          });

          const newGraph = buildGraphFromNotes(notes, topicsMap);
          saveGraph(newGraph);

          console.log(`✅ Knowledge Graph initialized: ${newGraph.nodes.length} nodes, ${newGraph.edges.length} edges`);
        } else {
          console.log(`📊 Knowledge Graph loaded: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);
        }

        // 2. Run initial automation suggestions after a short delay
        setTimeout(async () => {
          console.log("🤖 Running initial AI suggestions...");
          try {
            const suggestions = await generateProactiveSuggestions();
            suggestions.forEach(suggestion => addAISuggestion(suggestion));
            console.log(`✨ Generated ${suggestions.length} initial AI suggestions`);
          } catch (error) {
            console.error("Error generating initial suggestions:", error);
          }
        }, 5000); // Wait 5 seconds after startup

        // Hide loading screen after initialization
        setTimeout(() => {
          setIsInitializing(false);
        }, 1500);
      } catch (error) {
        console.error("Intelligence system initialization error:", error);
        setIsInitializing(false);
      }
    };

    initializeIntelligenceSystem();
  }, []);

  // Update category counts when notes change
  useEffect(() => {
    const updateCounts = () => {
      const notes = loadNotes();
      const counts: Record<NoteCategory | "all", number> = {
        all: notes.length,
        task: 0,
        event: 0,
        idea: 0,
        info: 0,
        person: 0,
      };

      notes.forEach((note) => {
        counts[note.category]++;
      });

      setCategoryCounts(counts);
    };

    updateCounts();

    // Poll for changes (simple approach for MVP)
    const interval = setInterval(updateCounts, 1000);
    return () => clearInterval(interval);
  }, []);

  // GLOBAL AUTOMATION SCHEDULER - Runs in background every 60 seconds
  useEffect(() => {
    console.log("⏰ Starting global Automation Engine scheduler...");

    const runAutomationCycle = async () => {
      try {
        console.log("🔄 Running automation cycle...");
        const suggestions = await generateProactiveSuggestions();

        if (suggestions.length > 0) {
          suggestions.forEach(suggestion => addAISuggestion(suggestion));
          console.log(`✨ Automation: ${suggestions.length} new suggestion(s) generated`);
        }
      } catch (error) {
        console.error("Automation cycle error:", error);
      }
    };

    // Run every 60 seconds
    const automationInterval = setInterval(runAutomationCycle, 60000);

    return () => {
      console.log("⏰ Stopping automation scheduler...");
      clearInterval(automationInterval);
    };
  }, []);

  const handleViewChange = (view: string) => {
    setActiveView(view as View);
    if (view !== "notes") {
      setSelectedCategory("all");
    }
  };

  return (
    <div className="flex h-screen bg-dark-bg overflow-hidden">
      {/* Intelligence System Initialization Splash Screen */}
      {isInitializing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-bg">
          <div className="text-center">
            <div className="inline-flex items-center gap-4 mb-6">
              <img src="/logo.svg" alt="NexMind" className="w-16 h-16 animate-pulse" />
              <div>
                <h1 className="text-4xl font-display font-bold text-text-primary mb-2">
                  NexMind
                </h1>
                <p className="text-sm text-text-muted">The Memory That Thinks</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-accent">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: "200ms" }} />
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: "400ms" }} />
            </div>
            <p className="text-sm text-text-secondary mt-4">
              Initialisiere KI-Systeme...
            </p>
          </div>
        </div>
      )}

      <Sidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categoryCounts={categoryCounts}
      />

      <main className="flex-1 overflow-hidden">
        {activeView === "notes" && <NotesView selectedCategory={selectedCategory} />}
        {activeView === "chat" && <ChatView />}
        {activeView === "brain" && <BrainReportView />}
        {activeView === "graph" && <GraphView />}
        {activeView === "tasks" && <TaskDashboardView />}
        {activeView === "ai" && <AISuggestionsView />}
      </main>
    </div>
  );
}

export default App;
