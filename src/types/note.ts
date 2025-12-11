export type NoteCategory = "task" | "event" | "idea" | "info" | "person";

export interface Note {
  id: string;
  content: string;
  category: NoteCategory;
  createdAt: string;
  updatedAt?: string;
  relatedNoteIds?: string[];
  entities?: {
    persons: string[];
    places: string[];
    projects: string[];
    topics?: string[]; // V3: Topics für Knowledge Graph
  };
  embedding?: number[];
  categoryConfidence?: number;
  categoryReason?: string;
}

export interface SemanticClassification {
  category: NoteCategory;
  confidence: number;
  reason: string;
  allCategoryConfidences: Record<NoteCategory, number>;
}

export interface CategoryInfo {
  id: NoteCategory;
  label: string;
  icon: string;
  color: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: "task", label: "Aufgaben", icon: "CheckSquare", color: "bg-blue-100 text-blue-700" },
  { id: "event", label: "Termine", icon: "Calendar", color: "bg-purple-100 text-purple-700" },
  { id: "idea", label: "Ideen", icon: "Lightbulb", color: "bg-yellow-100 text-yellow-700" },
  { id: "info", label: "Infos", icon: "FileText", color: "bg-green-100 text-green-700" },
  { id: "person", label: "Personen", icon: "User", color: "bg-pink-100 text-pink-700" },
];

export interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: string;
  noteId?: string;
}

/**
 * INTELLIGENCE LAYER V3: Knowledge Graph Types
 */

export type NodeType = "note" | "person" | "place" | "project" | "topic";
export type EdgeType = "mentions" | "relatedTo" | "similarTo" | "topicOf" | "projectOf";

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  embedding?: number[];
  metadata?: {
    noteId?: string;
    category?: NoteCategory;
    createdAt?: string;
    count?: number; // For entity nodes: how many notes reference this
  };
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  type: EdgeType;
  strength: number; // 0.0 to 1.0
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  lastUpdated: string;
}
