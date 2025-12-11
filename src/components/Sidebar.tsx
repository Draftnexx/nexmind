import { CheckSquare, Calendar, Lightbulb, FileText, User, BarChart3, MessageSquare, StickyNote } from "lucide-react";
import { NoteCategory } from "../types/note";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  selectedCategory: NoteCategory | "all";
  onCategoryChange: (category: NoteCategory | "all") => void;
  categoryCounts: Record<NoteCategory | "all", number>;
}

const viewIcons = {
  notes: StickyNote,
  chat: MessageSquare,
  brain: BarChart3,
};

const categoryIcons = {
  all: FileText,
  task: CheckSquare,
  event: Calendar,
  idea: Lightbulb,
  info: FileText,
  person: User,
};

const categoryLabels = {
  all: "Alle Notizen",
  task: "Aufgaben",
  event: "Termine",
  idea: "Ideen",
  info: "Infos",
  person: "Personen",
};

export default function Sidebar({
  activeView,
  onViewChange,
  selectedCategory,
  onCategoryChange,
  categoryCounts,
}: SidebarProps) {
  return (
    <div className="w-64 bg-dark-bg border-r border-border-dark flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-border-dark">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="Draftnex Logo" className="w-10 h-10" />
          <div>
            <h1 className="text-xl font-display font-bold text-text-primary">NexMind</h1>
            <p className="text-[10px] text-text-muted">The Memory That Thinks</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 border-b border-border-dark">
        <div className="space-y-1.5">
          {(["notes", "chat", "brain"] as const).map((view) => {
            const Icon = viewIcons[view];
            const isActive = activeView === view;
            return (
              <button
                key={view}
                onClick={() => onViewChange(view)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                  isActive
                    ? "bg-primary/20 text-primary border-l-4 border-primary shadow-glow-primary"
                    : "text-text-secondary hover:bg-dark-elevated hover:text-text-primary"
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">
                  {view === "brain" ? "Brain Report" : view === "notes" ? "Notizen" : "Chat"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Categories (only show in notes view) */}
      {activeView === "notes" && (
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-3 px-2">
            Kategorien
          </h3>
          <div className="space-y-1">
            {(["all", "task", "event", "idea", "info", "person"] as const).map((cat) => {
              const Icon = categoryIcons[cat];
              const isActive = selectedCategory === cat;
              const count = categoryCounts[cat] || 0;

              return (
                <button
                  key={cat}
                  onClick={() => onCategoryChange(cat)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? "bg-dark-elevated text-text-primary border border-primary/30"
                      : "text-text-secondary hover:bg-dark-surface hover:text-text-primary"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} />
                    <span className="text-sm font-medium">
                      {categoryLabels[cat]}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    isActive
                      ? "bg-primary/20 text-primary"
                      : "bg-dark-elevated text-text-muted"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-border-dark">
        <p className="text-xs text-text-muted text-center">
          © 2025 <span className="text-primary font-medium">Draftnex Solutions</span>
        </p>
      </div>
    </div>
  );
}
