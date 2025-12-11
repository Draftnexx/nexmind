import { useEffect, useState } from "react";
import { Network, Users, MapPin, Briefcase, Tag, FileText, TrendingUp, Zap } from "lucide-react";
import { loadGraph, getTopEntities, buildGraphFromNotes } from "../services/graph";
import { loadNotes } from "../storage/localStorage";
import { KnowledgeGraph } from "../types/note";

export default function GraphView() {
  const [graph, setGraph] = useState<KnowledgeGraph | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);

  useEffect(() => {
    loadGraphData();
  }, []);

  const loadGraphData = () => {
    const loadedGraph = loadGraph();
    setGraph(loadedGraph);
  };

  const handleRebuildGraph = async () => {
    setIsBuilding(true);
    try {
      const notes = loadNotes();
      const newGraph = buildGraphFromNotes(notes);
      setGraph(newGraph);
      console.log("✅ Graph manually rebuilt");
    } catch (error) {
      console.error("Error rebuilding graph:", error);
    } finally {
      setIsBuilding(false);
    }
  };

  if (!graph) {
    return (
      <div className="flex-1 flex items-center justify-center bg-dark-bg">
        <div className="text-center">
          <Network size={64} className="text-accent mx-auto mb-4 animate-pulse" />
          <p className="text-text-secondary">Loading Knowledge Graph...</p>
        </div>
      </div>
    );
  }

  const topPersons = getTopEntities(graph, "person", 10);
  const topPlaces = getTopEntities(graph, "place", 10);
  const topProjects = getTopEntities(graph, "project", 10);
  const topTopics = getTopEntities(graph, "topic", 15);

  const noteNodes = graph.nodes.filter((n) => n.type === "note");
  const similarityEdges = graph.edges.filter((e) => e.type === "similarTo");
  const mentionEdges = graph.edges.filter((e) => e.type === "mentions");
  const topicEdges = graph.edges.filter((e) => e.type === "topicOf");

  return (
    <div className="flex-1 flex flex-col h-screen bg-dark-bg overflow-y-auto">
      {/* Header */}
      <div className="bg-dark-surface border-b border-border-dark px-8 py-6 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-accent/10 rounded-xl">
                  <Network size={28} className="text-accent" />
                </div>
                <h2 className="text-2xl font-display font-bold text-text-primary">
                  Knowledge Graph
                </h2>
              </div>
              <p className="text-sm text-text-secondary">
                Dein Wissensnetzwerk aus {noteNodes.length} Notizen, {graph.edges.length} Verbindungen
              </p>
            </div>
            <button
              onClick={handleRebuildGraph}
              disabled={isBuilding}
              className="px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-xl text-primary font-medium transition-all disabled:opacity-50"
            >
              {isBuilding ? (
                <span className="flex items-center gap-2">
                  <Zap size={16} className="animate-pulse" />
                  Wird neu gebaut...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <TrendingUp size={16} />
                  Graph neu bauen
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 px-8 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card-elevated p-6">
              <div className="flex items-center gap-3 mb-2">
                <FileText size={20} className="text-primary" />
                <span className="text-sm font-medium text-text-secondary">Notizen</span>
              </div>
              <p className="text-3xl font-display font-bold text-text-primary">{noteNodes.length}</p>
            </div>

            <div className="card-elevated p-6">
              <div className="flex items-center gap-3 mb-2">
                <Network size={20} className="text-accent" />
                <span className="text-sm font-medium text-text-secondary">Ähnlichkeiten</span>
              </div>
              <p className="text-3xl font-display font-bold text-text-primary">
                {similarityEdges.length / 2}
              </p>
            </div>

            <div className="card-elevated p-6">
              <div className="flex items-center gap-3 mb-2">
                <Tag size={20} className="text-cat-idea" />
                <span className="text-sm font-medium text-text-secondary">Topics</span>
              </div>
              <p className="text-3xl font-display font-bold text-text-primary">
                {topTopics.length}
              </p>
            </div>

            <div className="card-elevated p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users size={20} className="text-cat-person" />
                <span className="text-sm font-medium text-text-secondary">Entities</span>
              </div>
              <p className="text-3xl font-display font-bold text-text-primary">
                {topPersons.length + topPlaces.length + topProjects.length}
              </p>
            </div>
          </div>

          {/* Top Topics */}
          {topTopics.length > 0 && (
            <div className="card-elevated p-6">
              <div className="flex items-center gap-2 mb-4">
                <Tag size={22} className="text-cat-idea" />
                <h3 className="text-lg font-display font-semibold text-text-primary">
                  Häufigste Topics
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {topTopics.map((topic, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 bg-cat-idea/10 border border-cat-idea/30 rounded-full flex items-center gap-2"
                  >
                    <span className="text-cat-idea font-medium">{topic.label}</span>
                    <span className="text-xs text-cat-idea/70 font-semibold">
                      {topic.count}x
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Entities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Personen */}
            {topPersons.length > 0 && (
              <div className="card-elevated p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users size={20} className="text-cat-person" />
                  <h3 className="text-base font-display font-semibold text-text-primary">
                    Personen
                  </h3>
                </div>
                <div className="space-y-2">
                  {topPersons.map((person, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-dark-elevated rounded-xl border border-border-dark"
                    >
                      <span className="text-text-primary font-medium text-sm">
                        {person.label}
                      </span>
                      <span className="text-xs text-text-muted font-semibold">
                        {person.count} Notizen
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Orte */}
            {topPlaces.length > 0 && (
              <div className="card-elevated p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin size={20} className="text-cat-event" />
                  <h3 className="text-base font-display font-semibold text-text-primary">
                    Orte
                  </h3>
                </div>
                <div className="space-y-2">
                  {topPlaces.map((place, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-dark-elevated rounded-xl border border-border-dark"
                    >
                      <span className="text-text-primary font-medium text-sm">
                        {place.label}
                      </span>
                      <span className="text-xs text-text-muted font-semibold">
                        {place.count} Notizen
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projekte */}
            {topProjects.length > 0 && (
              <div className="card-elevated p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase size={20} className="text-cat-info" />
                  <h3 className="text-base font-display font-semibold text-text-primary">
                    Projekte
                  </h3>
                </div>
                <div className="space-y-2">
                  {topProjects.map((project, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-dark-elevated rounded-xl border border-border-dark"
                    >
                      <span className="text-text-primary font-medium text-sm">
                        {project.label}
                      </span>
                      <span className="text-xs text-text-muted font-semibold">
                        {project.count} Notizen
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Edge Stats */}
          <div className="card-elevated p-6">
            <h3 className="text-lg font-display font-semibold text-text-primary mb-4">
              Verbindungstypen
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-dark-elevated rounded-xl border border-border-dark">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-secondary">Similarity Edges</span>
                  <Network size={16} className="text-accent" />
                </div>
                <p className="text-2xl font-display font-bold text-text-primary">
                  {similarityEdges.length / 2}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Notizen mit ähnlichem Inhalt
                </p>
              </div>

              <div className="p-4 bg-dark-elevated rounded-xl border border-border-dark">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-secondary">Mention Edges</span>
                  <Users size={16} className="text-cat-person" />
                </div>
                <p className="text-2xl font-display font-bold text-text-primary">
                  {mentionEdges.length}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Erwähnungen von Entities
                </p>
              </div>

              <div className="p-4 bg-dark-elevated rounded-xl border border-border-dark">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-secondary">Topic Edges</span>
                  <Tag size={16} className="text-cat-idea" />
                </div>
                <p className="text-2xl font-display font-bold text-text-primary">
                  {topicEdges.length}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Zuordnungen zu Topics
                </p>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="card-elevated p-6 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-3">
              <Network size={24} className="text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-display font-semibold text-text-primary mb-2">
                  Über den Knowledge Graph
                </h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Der Knowledge Graph verbindet automatisch alle deine Notizen basierend auf
                  semantischer Ähnlichkeit, gemeinsamen Entities (Personen, Orte, Projekte)
                  und Topics. Jede neue Notiz erweitert das Netzwerk und schafft neue Verbindungen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
