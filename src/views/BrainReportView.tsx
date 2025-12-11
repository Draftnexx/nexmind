import { useEffect, useState } from "react";
import { TrendingUp, Calendar, Sparkles, CheckSquare, Lightbulb, User, FileText, Brain, Target } from "lucide-react";
import { Note, NoteCategory } from "../types/note";
import { loadNotes } from "../storage/localStorage";
import { generateBrainReportInsights, BrainReportInsights } from "../services/ai";
import CategoryBadge from "../components/CategoryBadge";

export default function BrainReportView() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [weekNotes, setWeekNotes] = useState<Note[]>([]);
  const [aiInsights, setAiInsights] = useState<BrainReportInsights | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const allNotes = loadNotes();
      setNotes(allNotes);

      // Filter notes from last 7 days
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recentNotes = allNotes.filter(
        (note) => new Date(note.createdAt) >= sevenDaysAgo
      );
      setWeekNotes(recentNotes);

      // INTELLIGENCE LAYER V2: Generate AI Insights
      if (recentNotes.length > 0) {
        setIsLoadingInsights(true);
        try {
          const insights = await generateBrainReportInsights(allNotes, recentNotes);
          setAiInsights(insights);
          console.log("🧠 Brain Report Insights:", insights);
        } catch (error) {
          console.error("Error generating insights:", error);
        } finally {
          setIsLoadingInsights(false);
        }
      }
    };

    loadData();
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
      color: "text-cat-task",
      bgColor: "bg-cat-task/10",
    },
    {
      category: "event" as NoteCategory,
      count: getCategoryCount("event"),
      icon: Calendar,
      label: "Termine",
      color: "text-cat-event",
      bgColor: "bg-cat-event/10",
    },
    {
      category: "idea" as NoteCategory,
      count: getCategoryCount("idea"),
      icon: Lightbulb,
      label: "Ideen",
      color: "text-cat-idea",
      bgColor: "bg-cat-idea/10",
    },
    {
      category: "info" as NoteCategory,
      count: getCategoryCount("info"),
      icon: FileText,
      label: "Infos",
      color: "text-cat-info",
      bgColor: "bg-cat-info/10",
    },
    {
      category: "person" as NoteCategory,
      count: getCategoryCount("person"),
      icon: User,
      label: "Personen",
      color: "text-cat-person",
      bgColor: "bg-cat-person/10",
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
    <div className="flex-1 overflow-y-auto h-screen bg-dark-bg">
      {/* Header */}
      <div className="bg-dark-surface border-b border-border-dark px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-accent/10 rounded-xl">
              <TrendingUp size={24} className="text-accent" />
            </div>
            <h2 className="text-2xl font-display font-bold text-text-primary">
              Brain Report
            </h2>
          </div>
          <p className="text-sm text-text-secondary">
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
            <div className="card-elevated p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Sparkles size={28} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary font-medium">Gesamt</p>
                  <p className="text-3xl font-display font-bold text-text-primary">
                    {notes.length}
                  </p>
                  <p className="text-xs text-text-muted mt-1">Alle Notizen</p>
                </div>
              </div>
            </div>

            {/* This Week */}
            <div className="card-elevated p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/10 rounded-xl">
                  <Calendar size={28} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary font-medium">Diese Woche</p>
                  <p className="text-3xl font-display font-bold text-text-primary">
                    {weekNotes.length}
                  </p>
                  <p className="text-xs text-text-muted mt-1">Letzte 7 Tage</p>
                </div>
              </div>
            </div>

            {/* Most Active Category */}
            <div className="card-elevated p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cat-idea/10 rounded-xl">
                  <TrendingUp size={28} className="text-cat-idea" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary font-medium">Top Kategorie</p>
                  <p className="text-xl font-display font-bold text-text-primary">
                    {categoryStats.reduce((prev, current) =>
                      current.count > prev.count ? current : prev
                    ).label}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
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
          <div className="card-elevated p-6">
            <h3 className="text-lg font-display font-semibold text-text-primary mb-4">
              Kategorien-Übersicht
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {categoryStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.category}
                    className={`p-5 rounded-2xl ${stat.bgColor} border border-border-dark`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Icon size={20} className={stat.color} />
                      <span className="text-sm font-medium text-text-primary">
                        {stat.label}
                      </span>
                    </div>
                    <p className={`text-3xl font-display font-bold ${stat.color}`}>
                      {stat.count}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Insights - INTELLIGENCE LAYER V2 */}
          {isLoadingInsights && (
            <div className="card-elevated p-8 text-center">
              <div className="inline-flex items-center gap-3 text-accent">
                <Brain size={28} className="animate-pulse" />
                <Sparkles size={24} className="animate-spin" />
                <span className="text-lg font-medium">KI analysiert deine Woche...</span>
              </div>
            </div>
          )}

          {aiInsights && !isLoadingInsights && (
            <>
              {/* AI Summary */}
              <div className="card-elevated p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-accent/10 rounded-xl">
                    <Brain size={24} className="text-accent" />
                  </div>
                  <h3 className="text-lg font-display font-semibold text-text-primary">
                    KI-Analyse deiner Woche
                  </h3>
                </div>
                <p className="text-text-primary text-base leading-relaxed mb-4">
                  {aiInsights.weekSummary}
                </p>
                <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                  <Target size={20} className="text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-text-secondary mb-1">
                      Empfohlener Fokus
                    </p>
                    <p className="text-text-primary">
                      {aiInsights.recommendedFocus}
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Insights List */}
              {aiInsights.insights.length > 0 && (
                <div className="card-elevated p-6">
                  <h3 className="text-lg font-display font-semibold text-text-primary mb-4">
                    Wichtige Erkenntnisse
                  </h3>
                  <div className="space-y-3">
                    {aiInsights.insights.map((insight, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-4 bg-dark-elevated rounded-xl border border-border-dark"
                      >
                        <Sparkles size={18} className="text-accent mt-0.5 flex-shrink-0" />
                        <p className="text-text-primary text-sm">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Open Tasks from AI */}
              {aiInsights.openTasks.length > 0 && (
                <div className="card-elevated p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckSquare size={22} className="text-cat-task" />
                    <h3 className="text-lg font-display font-semibold text-text-primary">
                      Offene Aufgaben
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {aiInsights.openTasks.map((task, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-dark-elevated rounded-xl border border-border-dark"
                      >
                        <div className="w-5 h-5 rounded border-2 border-cat-task flex-shrink-0" />
                        <p className="text-text-primary text-sm">{task}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Entities */}
              {(aiInsights.topEntities.persons.length > 0 ||
                aiInsights.topEntities.places.length > 0 ||
                aiInsights.topEntities.projects.length > 0) && (
                <div className="card-elevated p-6">
                  <h3 className="text-lg font-display font-semibold text-text-primary mb-4">
                    Wichtige Entitäten
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {aiInsights.topEntities.persons.length > 0 && (
                      <div className="p-4 bg-dark-elevated rounded-xl border border-border-dark">
                        <div className="flex items-center gap-2 mb-3">
                          <User size={18} className="text-cat-person" />
                          <span className="text-sm font-medium text-text-secondary">
                            Personen
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {aiInsights.topEntities.persons.map((person, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-cat-person/10 text-cat-person text-xs font-medium rounded-full"
                            >
                              {person}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {aiInsights.topEntities.places.length > 0 && (
                      <div className="p-4 bg-dark-elevated rounded-xl border border-border-dark">
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar size={18} className="text-cat-event" />
                          <span className="text-sm font-medium text-text-secondary">
                            Orte
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {aiInsights.topEntities.places.map((place, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-cat-event/10 text-cat-event text-xs font-medium rounded-full"
                            >
                              {place}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {aiInsights.topEntities.projects.length > 0 && (
                      <div className="p-4 bg-dark-elevated rounded-xl border border-border-dark">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText size={18} className="text-cat-info" />
                          <span className="text-sm font-medium text-text-secondary">
                            Projekte
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {aiInsights.topEntities.projects.map((project, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-cat-info/10 text-cat-info text-xs font-medium rounded-full"
                            >
                              {project}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Top Ideas */}
          {topIdeas.length > 0 && (
            <div className="card-elevated p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb size={22} className="text-cat-idea" />
                <h3 className="text-lg font-display font-semibold text-text-primary">
                  Top Ideen dieser Woche
                </h3>
              </div>
              <div className="space-y-3">
                {topIdeas.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 bg-dark-elevated rounded-xl border border-border-dark hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <CategoryBadge category={note.category} />
                      <span className="text-xs text-text-muted">
                        {formatDate(note.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-text-primary leading-relaxed">
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {weekNotes.length === 0 && (
            <div className="card-elevated p-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-dark-elevated border border-border-dark mb-6">
                <Sparkles size={32} className="text-accent" />
              </div>
              <h3 className="text-xl font-display font-semibold text-text-primary mb-2">
                Noch keine Daten
              </h3>
              <p className="text-text-secondary">
                Erstelle ein paar Notizen, um deinen Brain Report zu sehen.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
