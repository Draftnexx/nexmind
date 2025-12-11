import { useState, useEffect } from "react";
import { Sparkles, Zap, RefreshCw } from "lucide-react";
import AISuggestions from "../components/AISuggestions";
import { generateProactiveSuggestions } from "../services/automation";
import { addAISuggestion, getPendingAISuggestions, clearOldAISuggestions } from "../storage/localStorage";

export default function AISuggestionsView() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Initial load
    updatePendingCount();
    clearOldAISuggestions();

    // Start proactive scheduler (runs every 60 seconds)
    const schedulerInterval = setInterval(async () => {
      await runProactiveSuggestions();
    }, 60000); // 60 seconds

    // Also run on mount after 5 seconds
    const initialTimeout = setTimeout(async () => {
      await runProactiveSuggestions();
    }, 5000);

    return () => {
      clearInterval(schedulerInterval);
      clearTimeout(initialTimeout);
    };
  }, []);

  const updatePendingCount = () => {
    const pending = getPendingAISuggestions();
    setPendingCount(pending.length);
  };

  const runProactiveSuggestions = async () => {
    try {
      console.log("🤖 Running proactive AI suggestions...");
      const suggestions = await generateProactiveSuggestions();

      // Add new suggestions to localStorage
      suggestions.forEach(suggestion => {
        addAISuggestion(suggestion);
      });

      if (suggestions.length > 0) {
        console.log(`✨ Generated ${suggestions.length} new AI suggestions`);
      }

      setLastGenerated(new Date());
      updatePendingCount();
    } catch (error) {
      console.error("Error generating AI suggestions:", error);
    }
  };

  const handleManualGenerate = async () => {
    setIsGenerating(true);
    await runProactiveSuggestions();
    setIsGenerating(false);
  };

  const formatLastGenerated = () => {
    if (!lastGenerated) return "Noch nicht generiert";

    const now = new Date();
    const diffMs = now.getTime() - lastGenerated.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);

    if (diffMin === 0) return "Gerade eben";
    if (diffMin === 1) return "Vor 1 Minute";
    if (diffMin < 60) return `Vor ${diffMin} Minuten`;

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours === 1) return "Vor 1 Stunde";
    return `Vor ${diffHours} Stunden`;
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-dark-bg overflow-y-auto">
      {/* Header */}
      <div className="bg-dark-surface border-b border-border-dark px-8 py-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-accent/10 rounded-xl">
                  <Sparkles size={28} className="text-accent" />
                </div>
                <h2 className="text-2xl font-display font-bold text-text-primary">
                  KI-Vorschläge
                </h2>
              </div>
              <p className="text-sm text-text-secondary">
                Proaktive Automatisierung · {pendingCount} {pendingCount === 1 ? "offener Vorschlag" : "offene Vorschläge"}
              </p>
            </div>

            <button
              onClick={handleManualGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/80 disabled:bg-accent/50 text-white rounded-xl font-medium transition-colors"
            >
              <RefreshCw size={18} className={isGenerating ? "animate-spin" : ""} />
              {isGenerating ? "Generiere..." : "Neu generieren"}
            </button>
          </div>

          {/* Status Bar */}
          <div className="mt-4 flex items-center gap-2 text-xs text-text-muted">
            <div className="flex items-center gap-1.5">
              <Zap size={14} className="text-accent" />
              <span>Automatisch alle 60 Sekunden</span>
            </div>
            <span>·</span>
            <span>Zuletzt: {formatLastGenerated()}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-8 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Info Card */}
          <div className="card-elevated p-6 mb-6 border-l-4 border-accent">
            <div className="flex items-start gap-3">
              <Sparkles size={24} className="text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-display font-semibold text-text-primary mb-1">
                  Wie funktioniert die Automatisierung?
                </h3>
                <p className="text-sm text-text-secondary mb-3">
                  Die KI analysiert kontinuierlich deine Notizen, Tasks und den Knowledge Graph
                  und macht proaktive Vorschläge zur Organisation und Optimierung.
                </p>
                <ul className="text-sm text-text-secondary space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    <span><strong>Duplikate:</strong> Erkennt ähnliche Notizen und schlägt Zusammenführung vor</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    <span><strong>Projekte:</strong> Identifiziert wiederkehrende Themen und schlägt neue Projekte vor</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    <span><strong>Aufräumen:</strong> Findet veraltete, unvollständige oder unklare Notizen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    <span><strong>Aktionen:</strong> Empfiehlt nächste Schritte basierend auf deinen Tasks und Notizen</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Suggestions */}
          <AISuggestions />
        </div>
      </div>
    </div>
  );
}
