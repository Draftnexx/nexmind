import { Note, NoteCategory, TaskStatus, TaskPriority } from "../types/note";
import { KnowledgeGraph, GraphNode, GraphEdge } from "../types/note";
import { calculateCosineSimilarity } from "./embeddings";
import { loadNotes, getTasks } from "../storage/localStorage";
import { loadGraph } from "./graph";

/**
 * AUTOMATION ENGINE V5: Auto-Organization & Proactive AI
 *
 * This service provides intelligent automation features:
 * - Duplicate detection and merge suggestions
 * - Project auto-detection and assignment
 * - Topic clustering and auto-tagging
 * - Outdated content detection
 * - Incomplete task detection
 * - Ambiguous note detection
 * - Emerging project detection with AI
 * - Smart next action suggestions
 */

export interface DuplicateGroup {
  notes: Note[];
  similarity: number;
  reason: string;
}

export interface MergeSuggestion {
  notes: Note[];
  mergedContent: string;
  confidence: number;
  reason: string;
}

export interface ProjectMatch {
  noteId: string;
  projectName: string;
  confidence: number;
  reason: string;
}

export interface TopicCluster {
  topic: string;
  noteIds: string[];
  strength: number;
}

export interface CleanupSuggestion {
  type: "outdated" | "incomplete" | "ambiguous";
  noteId: string;
  reason: string;
  suggestedAction: string;
  confidence: number;
}

export interface EmergingProject {
  name: string;
  relatedNoteIds: string[];
  topics: string[];
  confidence: number;
  reason: string;
}

export interface NextActionSuggestion {
  type: "task" | "follow_up" | "organize" | "cleanup";
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  relatedNoteIds: string[];
}

export interface AISuggestion {
  id: string;
  type: "duplicate" | "project" | "cleanup" | "action" | "emerging_project";
  title: string;
  description: string;
  data: any;
  confidence: number;
  createdAt: string;
  status: "pending" | "accepted" | "rejected";
}

// ==========================================
// DUPLICATE DETECTION
// ==========================================

/**
 * Detects duplicate or very similar notes based on embeddings
 */
export function detectDuplicates(note: Note, allNotes: Note[], threshold = 0.85): DuplicateGroup[] {
  if (!note.embedding) return [];

  const duplicates: DuplicateGroup[] = [];
  const similarNotes: Note[] = [];

  for (const otherNote of allNotes) {
    if (otherNote.id === note.id || !otherNote.embedding) continue;

    const similarity = calculateCosineSimilarity(note.embedding, otherNote.embedding);

    if (similarity >= threshold) {
      similarNotes.push(otherNote);
    }
  }

  if (similarNotes.length > 0) {
    duplicates.push({
      notes: [note, ...similarNotes],
      similarity: Math.max(...similarNotes.map(n =>
        calculateCosineSimilarity(note.embedding!, n.embedding!)
      )),
      reason: `${similarNotes.length} sehr ähnliche Notizen gefunden (${Math.round(duplicates[0]?.similarity * 100 || 0)}% Übereinstimmung)`,
    });
  }

  return duplicates;
}

/**
 * Suggests how to merge duplicate notes
 */
export function suggestMergeNotes(duplicates: Note[]): MergeSuggestion | null {
  if (duplicates.length < 2) return null;

  // Sort by creation date (oldest first)
  const sorted = [...duplicates].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Merge content intelligently
  const uniqueContents = new Set(sorted.map(n => n.content.trim()));
  const mergedContent = Array.from(uniqueContents).join("\n\n---\n\n");

  // Collect all entities
  const allPersons = new Set<string>();
  const allPlaces = new Set<string>();
  const allProjects = new Set<string>();
  const allTopics = new Set<string>();

  sorted.forEach(note => {
    note.entities?.persons?.forEach(p => allPersons.add(p));
    note.entities?.places?.forEach(p => allPlaces.add(p));
    note.entities?.projects?.forEach(p => allProjects.add(p));
    note.entities?.topics?.forEach(t => allTopics.add(t));
  });

  return {
    notes: sorted,
    mergedContent,
    confidence: uniqueContents.size === 1 ? 0.95 : 0.75,
    reason: uniqueContents.size === 1
      ? "Identischer Inhalt - sehr wahrscheinlich Duplikat"
      : "Sehr ähnlicher Inhalt - könnte zusammengeführt werden",
  };
}

// ==========================================
// PROJECT DETECTION & ASSIGNMENT
// ==========================================

/**
 * Detects which existing projects a note might belong to
 */
export function detectProjectMatches(note: Note, graph: KnowledgeGraph): ProjectMatch[] {
  const matches: ProjectMatch[] = [];

  // Find all project nodes in the graph
  const projectNodes = graph.nodes.filter(n => n.type === "project");

  for (const projectNode of projectNodes) {
    let confidence = 0;
    const reasons: string[] = [];

    // Check if note mentions the project in entities
    if (note.entities?.projects?.includes(projectNode.label)) {
      confidence += 0.5;
      reasons.push("Direkter Projektbezug");
    }

    // Check if note is connected to the project via edges
    const noteEdges = graph.edges.filter(e =>
      e.from === note.id && e.to === projectNode.id
    );
    if (noteEdges.length > 0) {
      confidence += 0.3;
      reasons.push("Graph-Verbindung vorhanden");
    }

    // Check shared topics
    const projectEdges = graph.edges.filter(e =>
      e.from === projectNode.id && e.type === "projectOf"
    );
    const projectTopics = projectEdges.map(e => e.to);
    const noteTopics = note.entities?.topics || [];

    const sharedTopics = noteTopics.filter(t =>
      projectTopics.some(pt => {
        const topicNode = graph.nodes.find(n => n.id === pt);
        return topicNode?.label === t;
      })
    );

    if (sharedTopics.length > 0) {
      confidence += sharedTopics.length * 0.1;
      reasons.push(`${sharedTopics.length} gemeinsame Topics`);
    }

    if (confidence > 0.3) {
      matches.push({
        noteId: note.id,
        projectName: projectNode.label,
        confidence: Math.min(confidence, 1.0),
        reason: reasons.join(", "),
      });
    }
  }

  return matches.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Automatically assigns a note to a project
 */
export function autoAssignProject(note: Note, projectName: string): Note {
  const existingProjects = note.entities?.projects || [];

  if (!existingProjects.includes(projectName)) {
    return {
      ...note,
      entities: {
        ...note.entities,
        persons: note.entities?.persons || [],
        places: note.entities?.places || [],
        projects: [...existingProjects, projectName],
        topics: note.entities?.topics || [],
      },
    };
  }

  return note;
}

// ==========================================
// TOPIC CLUSTERING
// ==========================================

/**
 * Detects topic clusters in the knowledge graph
 */
export function detectTopicClusters(graph: KnowledgeGraph, minNotes = 3): TopicCluster[] {
  const clusters: TopicCluster[] = [];

  // Find all topic nodes
  const topicNodes = graph.nodes.filter(n => n.type === "topic");

  for (const topicNode of topicNodes) {
    // Find all notes connected to this topic
    const topicEdges = graph.edges.filter(e =>
      e.to === topicNode.id && e.type === "topicOf"
    );

    if (topicEdges.length >= minNotes) {
      const avgStrength = topicEdges.reduce((sum, e) => sum + e.strength, 0) / topicEdges.length;

      clusters.push({
        topic: topicNode.label,
        noteIds: topicEdges.map(e => e.from),
        strength: avgStrength,
      });
    }
  }

  return clusters.sort((a, b) => b.noteIds.length - a.noteIds.length);
}

/**
 * Automatically tags notes with relevant topics from clusters
 */
export function autoTagTopics(note: Note, clusters: TopicCluster[]): string[] {
  const suggestedTopics: string[] = [];

  for (const cluster of clusters) {
    // Check if note content relates to cluster topic
    const lowerContent = note.content.toLowerCase();
    const lowerTopic = cluster.topic.toLowerCase();

    if (lowerContent.includes(lowerTopic)) {
      suggestedTopics.push(cluster.topic);
    }
  }

  return suggestedTopics;
}

// ==========================================
// CLEANUP & REFACTOR DETECTION
// ==========================================

/**
 * Detects outdated notes (old notes with no recent activity)
 */
export function detectOutdatedNotes(notes: Note[], daysOld = 90): CleanupSuggestion[] {
  const suggestions: CleanupSuggestion[] = [];
  const now = new Date();

  for (const note of notes) {
    const createdDate = new Date(note.createdAt);
    const daysSinceCreation = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);

    // Check if note is old and hasn't been updated
    if (daysSinceCreation > daysOld && !note.updatedAt) {
      suggestions.push({
        type: "outdated",
        noteId: note.id,
        reason: `Notiz ist ${Math.round(daysSinceCreation)} Tage alt und wurde nicht aktualisiert`,
        suggestedAction: "Archivieren oder Löschen",
        confidence: daysSinceCreation > 180 ? 0.9 : 0.6,
      });
    }
  }

  return suggestions;
}

/**
 * Detects incomplete tasks (open tasks without due dates or priority)
 */
export function detectIncompleteTasks(tasks: Note[]): CleanupSuggestion[] {
  const suggestions: CleanupSuggestion[] = [];

  for (const task of tasks) {
    if (task.category !== "task") continue;
    if ((task.status || "open") === "done") continue;

    const issues: string[] = [];

    if (!task.dueDate) {
      issues.push("kein Fälligkeitsdatum");
    }

    if (!task.priority) {
      issues.push("keine Priorität");
    }

    if (task.content.length < 10) {
      issues.push("zu kurze Beschreibung");
    }

    if (issues.length > 0) {
      suggestions.push({
        type: "incomplete",
        noteId: task.id,
        reason: `Task unvollständig: ${issues.join(", ")}`,
        suggestedAction: "Fehlende Informationen ergänzen",
        confidence: 0.8,
      });
    }
  }

  return suggestions;
}

/**
 * Detects ambiguous notes (very short or unclear notes)
 */
export function detectAmbiguousNotes(notes: Note[]): CleanupSuggestion[] {
  const suggestions: CleanupSuggestion[] = [];

  for (const note of notes) {
    const wordCount = note.content.split(/\s+/).length;

    // Very short notes (< 3 words)
    if (wordCount < 3) {
      suggestions.push({
        type: "ambiguous",
        noteId: note.id,
        reason: "Sehr kurze Notiz - möglicherweise unklar",
        suggestedAction: "Mehr Details hinzufügen oder löschen",
        confidence: 0.7,
      });
      continue;
    }

    // Notes with no entities extracted
    const hasEntities = (note.entities?.persons?.length || 0) > 0 ||
                       (note.entities?.places?.length || 0) > 0 ||
                       (note.entities?.projects?.length || 0) > 0 ||
                       (note.entities?.topics?.length || 0) > 0;

    if (!hasEntities && wordCount > 5) {
      suggestions.push({
        type: "ambiguous",
        noteId: note.id,
        reason: "Keine Entitäten erkannt - möglicherweise zu allgemein",
        suggestedAction: "Konkretere Informationen hinzufügen",
        confidence: 0.5,
      });
    }
  }

  return suggestions;
}

// ==========================================
// EMERGING PROJECT DETECTION (AI-POWERED)
// ==========================================

/**
 * Detects emerging projects from recurring themes and patterns
 * Uses AI to analyze note patterns and suggest new projects
 */
export async function detectEmergingProjects(
  notes: Note[],
  graph: KnowledgeGraph
): Promise<EmergingProject[]> {
  const emergingProjects: EmergingProject[] = [];

  // Find topic clusters with many notes but no associated project
  const clusters = detectTopicClusters(graph, 4);

  for (const cluster of clusters) {
    // Check if this topic already has a project
    const existingProjectEdges = graph.edges.filter(e =>
      e.type === "projectOf" &&
      graph.nodes.find(n => n.id === e.to && n.label === cluster.topic)
    );

    if (existingProjectEdges.length === 0 && cluster.noteIds.length >= 4) {
      // Get the actual notes
      const clusterNotes = notes.filter(n => cluster.noteIds.includes(n.id));

      // Analyze if notes show project-like patterns
      const taskCount = clusterNotes.filter(n => n.category === "task").length;
      const hasMultiplePeople = new Set(
        clusterNotes.flatMap(n => n.entities?.persons || [])
      ).size > 1;

      // High confidence if: multiple tasks + multiple people involved
      const confidence = (taskCount >= 2 ? 0.4 : 0.2) + (hasMultiplePeople ? 0.4 : 0.2);

      if (confidence >= 0.5) {
        emergingProjects.push({
          name: cluster.topic,
          relatedNoteIds: cluster.noteIds,
          topics: [cluster.topic],
          confidence,
          reason: `${cluster.noteIds.length} Notizen zum Thema "${cluster.topic}" gefunden (${taskCount} Tasks, ${hasMultiplePeople ? "mehrere Personen" : "einzelne Person"})`,
        });
      }
    }
  }

  // Find co-occurring topics that might form a project
  const topicCombinations = findFrequentTopicCombinations(notes, 3);

  for (const combo of topicCombinations) {
    if (combo.count >= 4) {
      const comboName = combo.topics.join(" + ");

      // Check if we don't already have this as an emerging project
      if (!emergingProjects.some(p => p.name === comboName)) {
        emergingProjects.push({
          name: comboName,
          relatedNoteIds: combo.noteIds,
          topics: combo.topics,
          confidence: Math.min(combo.count / 10, 0.9),
          reason: `${combo.count} Notizen kombinieren die Themen "${comboName}"`,
        });
      }
    }
  }

  return emergingProjects.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Helper: Finds frequently co-occurring topic combinations
 */
function findFrequentTopicCombinations(notes: Note[], minOccurrences: number): Array<{
  topics: string[];
  count: number;
  noteIds: string[];
}> {
  const combinations = new Map<string, { count: number; noteIds: string[] }>();

  for (const note of notes) {
    const topics = note.entities?.topics || [];

    if (topics.length >= 2) {
      // Generate all pairs of topics
      for (let i = 0; i < topics.length; i++) {
        for (let j = i + 1; j < topics.length; j++) {
          const key = [topics[i], topics[j]].sort().join("|");

          if (!combinations.has(key)) {
            combinations.set(key, { count: 0, noteIds: [] });
          }

          const combo = combinations.get(key)!;
          combo.count++;
          combo.noteIds.push(note.id);
        }
      }
    }
  }

  return Array.from(combinations.entries())
    .filter(([_, data]) => data.count >= minOccurrences)
    .map(([key, data]) => ({
      topics: key.split("|"),
      count: data.count,
      noteIds: data.noteIds,
    }));
}

// ==========================================
// SMART NEXT ACTION SUGGESTIONS
// ==========================================

/**
 * Suggests smart next actions based on notes, tasks, and graph patterns
 */
export function suggestNextActions(
  notes: Note[],
  tasks: Note[],
  graph: KnowledgeGraph
): NextActionSuggestion[] {
  const suggestions: NextActionSuggestion[] = [];

  // Suggest following up on overdue tasks
  const now = new Date().toISOString().split('T')[0];
  const overdueTasks = tasks.filter(t =>
    t.dueDate && t.dueDate < now && (t.status || "open") !== "done"
  );

  if (overdueTasks.length > 0) {
    suggestions.push({
      type: "task",
      title: "Überfällige Aufgaben bearbeiten",
      description: `${overdueTasks.length} überfällige ${overdueTasks.length === 1 ? "Aufgabe" : "Aufgaben"} benötigen Ihre Aufmerksamkeit`,
      priority: "high",
      relatedNoteIds: overdueTasks.map(t => t.id),
    });
  }

  // Suggest organizing notes without topics
  const notesWithoutTopics = notes.filter(n =>
    !n.entities?.topics || n.entities.topics.length === 0
  );

  if (notesWithoutTopics.length >= 5) {
    suggestions.push({
      type: "organize",
      title: "Notizen kategorisieren",
      description: `${notesWithoutTopics.length} Notizen haben keine Topics - empfohlen: manuell durchgehen`,
      priority: "low",
      relatedNoteIds: notesWithoutTopics.slice(0, 10).map(n => n.id),
    });
  }

  // Suggest cleaning up old notes
  const outdatedSuggestions = detectOutdatedNotes(notes, 120);

  if (outdatedSuggestions.length >= 3) {
    suggestions.push({
      type: "cleanup",
      title: "Alte Notizen aufräumen",
      description: `${outdatedSuggestions.length} alte Notizen könnten archiviert werden`,
      priority: "low",
      relatedNoteIds: outdatedSuggestions.slice(0, 10).map(s => s.noteId),
    });
  }

  // Suggest following up on notes with high similarity (might need merging)
  const recentNotes = notes.slice(0, 20); // Check last 20 notes
  const duplicateGroups: DuplicateGroup[] = [];

  recentNotes.forEach(note => {
    const dups = detectDuplicates(note, notes, 0.88);
    if (dups.length > 0) {
      duplicateGroups.push(...dups);
    }
  });

  if (duplicateGroups.length > 0) {
    suggestions.push({
      type: "organize",
      title: "Duplikate prüfen",
      description: `${duplicateGroups.length} mögliche ${duplicateGroups.length === 1 ? "Duplikat gefunden" : "Duplikate gefunden"}`,
      priority: "medium",
      relatedNoteIds: duplicateGroups.flatMap(g => g.notes.map(n => n.id)).slice(0, 10),
    });
  }

  // Suggest tasks that might need follow-up (in_progress but no recent update)
  const inProgressTasks = tasks.filter(t => (t.status || "open") === "in_progress");
  const staleInProgressTasks = inProgressTasks.filter(t => {
    const createdDate = new Date(t.updatedAt || t.createdAt);
    const daysSince = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince > 7;
  });

  if (staleInProgressTasks.length > 0) {
    suggestions.push({
      type: "follow_up",
      title: "Aufgaben-Status aktualisieren",
      description: `${staleInProgressTasks.length} "In Arbeit"-Aufgaben ohne Update seit über 7 Tagen`,
      priority: "medium",
      relatedNoteIds: staleInProgressTasks.map(t => t.id),
    });
  }

  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// ==========================================
// PROACTIVE SUGGESTION GENERATOR
// ==========================================

/**
 * Main entry point for proactive suggestion generation
 * Called by the background scheduler
 */
export async function generateProactiveSuggestions(): Promise<AISuggestion[]> {
  const suggestions: AISuggestion[] = [];
  const notes = loadNotes();
  const tasks = getTasks();
  const graph = loadGraph();

  // 1. Detect duplicates in recent notes
  const recentNotes = notes.slice(0, 10);
  for (const note of recentNotes) {
    const duplicates = detectDuplicates(note, notes, 0.88);

    if (duplicates.length > 0) {
      const mergeSuggestion = suggestMergeNotes(duplicates[0].notes);

      if (mergeSuggestion) {
        suggestions.push({
          id: `dup-${note.id}-${Date.now()}`,
          type: "duplicate",
          title: "Mögliche Duplikate gefunden",
          description: `${duplicates[0].notes.length} sehr ähnliche Notizen entdeckt`,
          data: mergeSuggestion,
          confidence: mergeSuggestion.confidence,
          createdAt: new Date().toISOString(),
          status: "pending",
        });
      }
    }
  }

  // 2. Detect emerging projects
  const emergingProjects = await detectEmergingProjects(notes, graph);

  for (const project of emergingProjects) {
    if (project.confidence >= 0.6) {
      suggestions.push({
        id: `proj-${project.name}-${Date.now()}`,
        type: "emerging_project",
        title: `Neues Projekt erkannt: "${project.name}"`,
        description: project.reason,
        data: project,
        confidence: project.confidence,
        createdAt: new Date().toISOString(),
        status: "pending",
      });
    }
  }

  // 3. Cleanup suggestions
  const outdated = detectOutdatedNotes(notes, 90);
  const incompleteTasks = detectIncompleteTasks(tasks);
  const ambiguous = detectAmbiguousNotes(notes);

  const allCleanup = [...outdated, ...incompleteTasks, ...ambiguous];

  // Only suggest top 3 cleanup items
  for (const cleanup of allCleanup.slice(0, 3)) {
    if (cleanup.confidence >= 0.7) {
      suggestions.push({
        id: `clean-${cleanup.noteId}-${Date.now()}`,
        type: "cleanup",
        title: `${cleanup.type === "outdated" ? "Alte Notiz" : cleanup.type === "incomplete" ? "Unvollständiger Task" : "Unklare Notiz"}`,
        description: cleanup.reason,
        data: cleanup,
        confidence: cleanup.confidence,
        createdAt: new Date().toISOString(),
        status: "pending",
      });
    }
  }

  // 4. Smart action suggestions
  const actions = suggestNextActions(notes, tasks, graph);

  // Only suggest top 2 actions
  for (const action of actions.slice(0, 2)) {
    suggestions.push({
      id: `action-${action.type}-${Date.now()}`,
      type: "action",
      title: action.title,
      description: action.description,
      data: action,
      confidence: action.priority === "high" ? 0.9 : action.priority === "medium" ? 0.7 : 0.5,
      createdAt: new Date().toISOString(),
      status: "pending",
    });
  }

  // Sort by confidence
  return suggestions.sort((a, b) => b.confidence - a.confidence);
}
