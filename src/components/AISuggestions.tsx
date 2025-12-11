import { useState, useEffect } from "react";
import {
  Sparkles,
  CheckCircle,
  XCircle,
  Zap,
  GitMerge,
  FolderPlus,
  Trash2,
  AlertTriangle,
  ChevronRight,
  Lightbulb,
} from "lucide-react";
import { AISuggestion } from "../services/automation";
import {
  loadAISuggestions,
  acceptAISuggestion,
  rejectAISuggestion,
} from "../storage/localStorage";

export default function AISuggestions() {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadSuggestions();

    // Poll for new suggestions every 10 seconds
    const interval = setInterval(loadSuggestions, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadSuggestions = () => {
    const allSuggestions = loadAISuggestions();
    // Only show pending suggestions
    setSuggestions(allSuggestions.filter(s => s.status === "pending"));
  };

  const handleAccept = (id: string) => {
    acceptAISuggestion(id);
    loadSuggestions();

    // Show success animation (optional: could add toast notification)
    console.log("✅ Suggestion accepted:", id);
  };

  const handleReject = (id: string) => {
    rejectAISuggestion(id);
    loadSuggestions();
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getIcon = (type: AISuggestion["type"]) => {
    switch (type) {
      case "duplicate":
        return GitMerge;
      case "project":
      case "emerging_project":
        return FolderPlus;
      case "cleanup":
        return Trash2;
      case "action":
        return Lightbulb;
      default:
        return Sparkles;
    }
  };

  const getTypeLabel = (type: AISuggestion["type"]) => {
    switch (type) {
      case "duplicate":
        return "Duplikat";
      case "project":
        return "Projekt";
      case "emerging_project":
        return "Neues Projekt";
      case "cleanup":
        return "Aufräumen";
      case "action":
        return "Aktion";
      default:
        return "Vorschlag";
    }
  };

  const getTypeColor = (type: AISuggestion["type"]) => {
    switch (type) {
      case "duplicate":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
      case "project":
      case "emerging_project":
        return "text-purple-500 bg-purple-500/10 border-purple-500/30";
      case "cleanup":
        return "text-red-500 bg-red-500/10 border-red-500/30";
      case "action":
        return "text-blue-500 bg-blue-500/10 border-blue-500/30";
      default:
        return "text-accent bg-accent/10 border-accent/30";
    }
  };

  if (suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="p-4 bg-dark-elevated rounded-full mb-4">
          <Sparkles size={32} className="text-accent" />
        </div>
        <h3 className="text-lg font-display font-semibold text-text-primary mb-2">
          Keine neuen Vorschläge
        </h3>
        <p className="text-sm text-text-secondary">
          Die KI beobachtet deine Notizen und wird proaktiv Vorschläge machen
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {suggestions.map((suggestion, index) => {
        const Icon = getIcon(suggestion.type);
        const isExpanded = expandedId === suggestion.id;

        return (
          <div
            key={suggestion.id}
            className={`card-elevated p-4 transition-all duration-300 ${
              index === 0 ? "animate-fadeIn" : ""
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className={`p-2 rounded-lg border ${getTypeColor(suggestion.type)}`}>
                <Icon size={20} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-base font-display font-semibold text-text-primary">
                    {suggestion.title}
                  </h4>

                  <button
                    onClick={() => toggleExpand(suggestion.id)}
                    className="flex-shrink-0 p-1 hover:bg-dark-surface rounded transition-colors"
                  >
                    <ChevronRight
                      size={18}
                      className={`text-text-muted transition-transform ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                </div>

                <p className="text-sm text-text-secondary mb-2">
                  {suggestion.description}
                </p>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getTypeColor(suggestion.type)}`}>
                    {getTypeLabel(suggestion.type)}
                  </span>

                  <span className="px-2 py-1 bg-dark-surface text-text-muted rounded-lg text-xs font-medium">
                    {Math.round(suggestion.confidence * 100)}% sicher
                  </span>

                  <span className="flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent rounded-lg text-xs font-medium">
                    <Zap size={12} />
                    KI
                  </span>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-border-dark animate-fadeIn">
                <SuggestionDetails suggestion={suggestion} />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => handleAccept(suggestion.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cat-task hover:bg-cat-task/80 text-white rounded-xl font-medium transition-colors"
              >
                <CheckCircle size={18} />
                Übernehmen
              </button>

              <button
                onClick={() => handleReject(suggestion.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-dark-surface hover:bg-dark-elevated border border-border-dark text-text-secondary hover:text-text-primary rounded-xl font-medium transition-colors"
              >
                <XCircle size={18} />
                Ignorieren
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Suggestion Details Component
interface SuggestionDetailsProps {
  suggestion: AISuggestion;
}

function SuggestionDetails({ suggestion }: SuggestionDetailsProps) {
  if (suggestion.type === "duplicate" && suggestion.data.notes) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
          Gefundene Duplikate:
        </p>
        {suggestion.data.notes.slice(0, 3).map((note: any) => (
          <div key={note.id} className="p-2 bg-dark-surface rounded-lg">
            <p className="text-sm text-text-primary line-clamp-2">
              {note.content}
            </p>
            <p className="text-xs text-text-muted mt-1">
              {new Date(note.createdAt).toLocaleDateString("de-DE")}
            </p>
          </div>
        ))}
        {suggestion.data.notes.length > 3 && (
          <p className="text-xs text-text-muted">
            +{suggestion.data.notes.length - 3} weitere
          </p>
        )}
      </div>
    );
  }

  if (
    (suggestion.type === "project" || suggestion.type === "emerging_project") &&
    suggestion.data
  ) {
    return (
      <div className="space-y-2">
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">
            Projektname:
          </p>
          <p className="text-sm text-text-primary font-medium">
            {suggestion.data.name}
          </p>
        </div>

        {suggestion.data.topics && suggestion.data.topics.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">
              Themen:
            </p>
            <div className="flex flex-wrap gap-1">
              {suggestion.data.topics.map((topic: string) => (
                <span
                  key={topic}
                  className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {suggestion.data.relatedNoteIds && (
          <p className="text-xs text-text-muted">
            {suggestion.data.relatedNoteIds.length} verwandte Notizen
          </p>
        )}
      </div>
    );
  }

  if (suggestion.type === "cleanup" && suggestion.data) {
    return (
      <div className="space-y-2">
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">
            Empfohlene Aktion:
          </p>
          <p className="text-sm text-text-primary">
            {suggestion.data.suggestedAction}
          </p>
        </div>

        <div className="flex items-start gap-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <AlertTriangle size={16} className="text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-500">
            {suggestion.data.reason}
          </p>
        </div>
      </div>
    );
  }

  if (suggestion.type === "action" && suggestion.data) {
    return (
      <div className="space-y-2">
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">
            Typ:
          </p>
          <p className="text-sm text-text-primary capitalize">
            {suggestion.data.type}
          </p>
        </div>

        {suggestion.data.priority && (
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">
              Priorität:
            </p>
            <span
              className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${
                suggestion.data.priority === "high"
                  ? "bg-red-500/10 text-red-500"
                  : suggestion.data.priority === "medium"
                  ? "bg-yellow-500/10 text-yellow-500"
                  : "bg-green-500/10 text-green-500"
              }`}
            >
              {suggestion.data.priority === "high"
                ? "Hoch"
                : suggestion.data.priority === "medium"
                ? "Mittel"
                : "Niedrig"}
            </span>
          </div>
        )}

        {suggestion.data.relatedNoteIds && suggestion.data.relatedNoteIds.length > 0 && (
          <p className="text-xs text-text-muted">
            {suggestion.data.relatedNoteIds.length} betroffene{" "}
            {suggestion.data.relatedNoteIds.length === 1 ? "Notiz" : "Notizen"}
          </p>
        )}
      </div>
    );
  }

  return null;
}
