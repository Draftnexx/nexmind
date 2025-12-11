import { useEffect, useState } from "react";
import { TrendingUp, Calendar, Sparkles, CheckSquare, Lightbulb, User, FileText } from "lucide-react";
import { Note, NoteCategory } from "../types/note";
import { loadNotes } from "../storage/localStorage";
import CategoryBadge from "../components/CategoryBadge";

export default function BrainReportView() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [weekNotes, setWeekNotes] = useState<Note[]>([]);

  useEffect(() => {
    const allNotes = loadNotes();
    setNotes(allNotes);

    // Filter notes from last 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentNotes = allNotes.filter(
      (note) => new Date(note.createdAt) >= sevenDaysAgo
    );
    setWeekNotes(recentNotes);
  }, []);

  const getCategoryCount = (category: NoteCategory) => {
    return weekNotes.filter((note) => note.category === category).length;
  };

  const categoryStats = [
    {
      category: "task" as NoteCategory,
      count: getCategoryCount("task"),
      icon: CheckSquare,
      label: "Aufgaben",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      category: "event" as NoteCategory,
      count: getCategoryCount("event"),
      icon: Calendar,
      label: "Termine",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      category: "idea" as NoteCategory,
      count: getCategoryCount("idea"),
      icon: Lightbulb,
      label: "Ideen",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      category: "info" as NoteCategory,
      count: getCategoryCount("info"),
      icon: FileText,
      label: "Infos",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      category: "person" as NoteCategory,
      count: getCategoryCount("person"),
      icon: User,
      label: "Personen",
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
  ];

  // Top Ideas (längste Notizen der Kategorie "idea")
  const topIdeas = weekNotes
    .filter((note) => note.category === "idea")
    .sort((a, b) => b.content.length - a.content.length)
    .slice(0, 5);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "short",
    });
  };

  return (
    <div className="flex-1 overflow-y-auto h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-accent/10 rounded-xl">
              <TrendingUp size={24} className="text-accent" />
            </div>
            <h2 className="text-2xl font-display font-bold text-gray-900">
              Brain Report
            </h2>
          </div>
          <p className="text-sm text-gray-500">
            Deine Wochenübersicht – automatisch erstellt von NexMind
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Notes */}
            <div className="card p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Sparkles size={24} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Gesamt</p>
                  <p className="text-3xl font-display font-bold text-gray-900">
                    {notes.length}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Alle Notizen</p>
                </div>
              </div>
            </div>

            {/* This Week */}
            <div className="card p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/10 rounded-xl">
                  <Calendar size={24} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Diese Woche</p>
                  <p className="text-3xl font-display font-bold text-gray-900">
                    {weekNotes.length}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Letzte 7 Tage</p>
                </div>
              </div>
            </div>

            {/* Most Active Category */}
            <div className="card p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <TrendingUp size={24} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Top Kategorie</p>
                  <p className="text-xl font-display font-bold text-gray-900">
                    {categoryStats.reduce((prev, current) =>
                      current.count > prev.count ? current : prev
                    ).label}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {categoryStats.reduce((prev, current) =>
                      current.count > prev.count ? current : prev
                    ).count}{" "}
                    Notizen
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="card p-6">
            <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">
              Kategorien-Übersicht
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {categoryStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.category}
                    className={`p-4 rounded-xl ${stat.bgColor} border border-gray-200`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={18} className={stat.color} />
                      <span className="text-sm font-medium text-gray-700">
                        {stat.label}
                      </span>
                    </div>
                    <p className={`text-2xl font-display font-bold ${stat.color}`}>
                      {stat.count}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Ideas */}
          {topIdeas.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb size={20} className="text-yellow-600" />
                <h3 className="text-lg font-display font-semibold text-gray-900">
                  Top Ideen dieser Woche
                </h3>
              </div>
              <div className="space-y-3">
                {topIdeas.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 bg-gray-50 rounded-xl border border-gray-200"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <CategoryBadge category={note.category} />
                      <span className="text-xs text-gray-500">
                        {formatDate(note.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {weekNotes.length === 0 && (
            <div className="card p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Sparkles size={28} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Noch keine Daten
              </h3>
              <p className="text-gray-500">
                Erstelle ein paar Notizen, um deinen Brain Report zu sehen.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
