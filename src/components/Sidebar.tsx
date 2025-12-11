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
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-display font-bold text-primary">NexMind</h1>
        <p className="text-xs text-gray-500 mt-1">The Memory That Thinks</p>
      </div>

      {/* Navigation */}
      <div className="p-4 border-b border-gray-200">
        <div className="space-y-1">
          {(["notes", "chat", "brain"] as const).map((view) => {
            const Icon = viewIcons[view];
            const isActive = activeView === view;
            return (
              <button
                key={view}
                onClick={() => onViewChange(view)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon size={20} />
                <span className="font-medium capitalize">
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
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
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
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-colors ${
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} />
                    <span className="text-sm font-medium">
                      {categoryLabels[cat]}
                    </span>
                  </div>
                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">
          © 2024 Draftnex Solutions
        </p>
      </div>
    </div>
  );
}
