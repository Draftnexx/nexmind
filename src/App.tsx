import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import NotesView from "./views/NotesView";
import ChatView from "./views/ChatView";
import BrainReportView from "./views/BrainReportView";
import GraphView from "./views/GraphView";
import { NoteCategory } from "./types/note";
import { loadNotes } from "./storage/localStorage";

type View = "notes" | "chat" | "brain" | "graph";

function App() {
  const [activeView, setActiveView] = useState<View>("notes");
  const [selectedCategory, setSelectedCategory] = useState<NoteCategory | "all">("all");
  const [categoryCounts, setCategoryCounts] = useState<Record<NoteCategory | "all", number>>({
    all: 0,
    task: 0,
    event: 0,
    idea: 0,
    info: 0,
    person: 0,
  });

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

  const handleViewChange = (view: string) => {
    setActiveView(view as View);
    if (view !== "notes") {
      setSelectedCategory("all");
    }
  };

  return (
    <div className="flex h-screen bg-dark-bg overflow-hidden">
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
      </main>
    </div>
  );
}

export default App;
