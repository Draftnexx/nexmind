import { Note } from "../types/note";
import { GraphNode, GraphEdge, KnowledgeGraph, NodeType } from "../types/note";
import { calculateCosineSimilarity } from "./embeddings";

/**
 * INTELLIGENCE LAYER V3: Knowledge Graph Service
 *
 * Baut und verwaltet den kompletten Knowledge Graph aus allen Notizen,
 * Entitäten (Personen, Orte, Projekte) und Topics.
 */

const GRAPH_STORAGE_KEY = "nexmind_knowledge_graph";
const SIMILARITY_THRESHOLD = 0.6; // Mindest-Ähnlichkeit für similarTo-Edges

/**
 * Lädt den Knowledge Graph aus localStorage
 */
export function loadGraph(): KnowledgeGraph {
  try {
    const stored = localStorage.getItem(GRAPH_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading graph:", error);
  }

  return {
    nodes: [],
    edges: [],
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Speichert den Knowledge Graph in localStorage
 */
export function saveGraph(graph: KnowledgeGraph): void {
  try {
    graph.lastUpdated = new Date().toISOString();
    localStorage.setItem(GRAPH_STORAGE_KEY, JSON.stringify(graph));
    console.log("📊 Knowledge Graph saved:", {
      nodes: graph.nodes.length,
      edges: graph.edges.length,
    });
  } catch (error) {
    console.error("Error saving graph:", error);
  }
}

/**
 * Generiert eine eindeutige Edge-ID
 */
function generateEdgeId(from: string, to: string, type: string): string {
  return `edge_${type}_${from}_${to}`;
}

/**
 * Fügt einen Node zum Graph hinzu (oder aktualisiert ihn)
 */
function addOrUpdateNode(graph: KnowledgeGraph, node: GraphNode): void {
  const existingIndex = graph.nodes.findIndex((n) => n.id === node.id);

  if (existingIndex >= 0) {
    // Update existing node
    graph.nodes[existingIndex] = {
      ...graph.nodes[existingIndex],
      ...node,
      metadata: {
        ...graph.nodes[existingIndex].metadata,
        ...node.metadata,
      },
    };
  } else {
    // Add new node
    graph.nodes.push(node);
  }
}

/**
 * Fügt eine Edge zum Graph hinzu (verhindert Duplikate)
 */
function addEdge(graph: KnowledgeGraph, edge: GraphEdge): void {
  const exists = graph.edges.some((e) => e.id === edge.id);

  if (!exists) {
    graph.edges.push(edge);
  } else {
    // Update strength if edge exists
    const existingEdge = graph.edges.find((e) => e.id === edge.id);
    if (existingEdge && edge.strength > existingEdge.strength) {
      existingEdge.strength = edge.strength;
    }
  }
}

/**
 * Fügt eine Notiz als Node zum Graph hinzu
 */
export function addNoteToGraph(note: Note, graph: KnowledgeGraph): void {
  // Create note node
  const noteNode: GraphNode = {
    id: `note_${note.id}`,
    type: "note",
    label: note.content.substring(0, 50) + (note.content.length > 50 ? "..." : ""),
    embedding: note.embedding,
    metadata: {
      noteId: note.id,
      category: note.category,
      createdAt: note.createdAt,
    },
  };

  addOrUpdateNode(graph, noteNode);
}

/**
 * Fügt Entity-Nodes (Personen, Orte, Projekte) zum Graph hinzu
 * und erstellt "mentions"-Edges von der Notiz zu den Entities
 */
export function addEntityNodes(note: Note, graph: KnowledgeGraph): void {
  if (!note.entities) return;

  const noteNodeId = `note_${note.id}`;

  // Personen
  note.entities.persons?.forEach((person) => {
    const personNodeId = `person_${person.toLowerCase().replace(/\s+/g, "_")}`;

    const personNode: GraphNode = {
      id: personNodeId,
      type: "person",
      label: person,
      metadata: {
        count: (graph.nodes.find((n) => n.id === personNodeId)?.metadata?.count || 0) + 1,
      },
    };

    addOrUpdateNode(graph, personNode);

    addEdge(graph, {
      id: generateEdgeId(noteNodeId, personNodeId, "mentions"),
      from: noteNodeId,
      to: personNodeId,
      type: "mentions",
      strength: 0.9,
    });
  });

  // Orte
  note.entities.places?.forEach((place) => {
    const placeNodeId = `place_${place.toLowerCase().replace(/\s+/g, "_")}`;

    const placeNode: GraphNode = {
      id: placeNodeId,
      type: "place",
      label: place,
      metadata: {
        count: (graph.nodes.find((n) => n.id === placeNodeId)?.metadata?.count || 0) + 1,
      },
    };

    addOrUpdateNode(graph, placeNode);

    addEdge(graph, {
      id: generateEdgeId(noteNodeId, placeNodeId, "mentions"),
      from: noteNodeId,
      to: placeNodeId,
      type: "mentions",
      strength: 0.9,
    });
  });

  // Projekte
  note.entities.projects?.forEach((project) => {
    const projectNodeId = `project_${project.toLowerCase().replace(/\s+/g, "_")}`;

    const projectNode: GraphNode = {
      id: projectNodeId,
      type: "project",
      label: project,
      metadata: {
        count: (graph.nodes.find((n) => n.id === projectNodeId)?.metadata?.count || 0) + 1,
      },
    };

    addOrUpdateNode(graph, projectNode);

    addEdge(graph, {
      id: generateEdgeId(noteNodeId, projectNodeId, "projectOf"),
      from: noteNodeId,
      to: projectNodeId,
      type: "projectOf",
      strength: 0.95,
    });
  });
}

/**
 * Fügt Topic-Nodes zum Graph hinzu und erstellt "topicOf"-Edges
 */
export function addTopicNodes(
  note: Note,
  topics: string[],
  graph: KnowledgeGraph
): void {
  if (!topics || topics.length === 0) return;

  const noteNodeId = `note_${note.id}`;

  topics.forEach((topic) => {
    const topicNodeId = `topic_${topic.toLowerCase().replace(/\s+/g, "_")}`;

    const topicNode: GraphNode = {
      id: topicNodeId,
      type: "topic",
      label: topic,
      metadata: {
        count: (graph.nodes.find((n) => n.id === topicNodeId)?.metadata?.count || 0) + 1,
      },
    };

    addOrUpdateNode(graph, topicNode);

    addEdge(graph, {
      id: generateEdgeId(noteNodeId, topicNodeId, "topicOf"),
      from: noteNodeId,
      to: topicNodeId,
      type: "topicOf",
      strength: 0.85,
    });
  });
}

/**
 * Berechnet Similarity-Edges zwischen einer Notiz und allen anderen Notizen
 */
export function addSimilarityEdges(note: Note, allNotes: Note[], graph: KnowledgeGraph): void {
  if (!note.embedding) return;

  const noteNodeId = `note_${note.id}`;

  allNotes.forEach((otherNote) => {
    if (otherNote.id === note.id || !otherNote.embedding) return;

    const similarity = calculateCosineSimilarity(note.embedding, otherNote.embedding);

    if (similarity >= SIMILARITY_THRESHOLD) {
      const otherNoteNodeId = `note_${otherNote.id}`;

      // Create bidirectional similarity edges
      addEdge(graph, {
        id: generateEdgeId(noteNodeId, otherNoteNodeId, "similarTo"),
        from: noteNodeId,
        to: otherNoteNodeId,
        type: "similarTo",
        strength: similarity,
      });

      addEdge(graph, {
        id: generateEdgeId(otherNoteNodeId, noteNodeId, "similarTo"),
        from: otherNoteNodeId,
        to: noteNodeId,
        type: "similarTo",
        strength: similarity,
      });
    }
  });
}

/**
 * Baut den kompletten Knowledge Graph aus allen Notizen neu auf
 */
export function buildGraphFromNotes(notes: Note[], topicsMap?: Map<string, string[]>): KnowledgeGraph {
  console.log("🔧 Building Knowledge Graph from", notes.length, "notes...");

  const graph: KnowledgeGraph = {
    nodes: [],
    edges: [],
    lastUpdated: new Date().toISOString(),
  };

  // 1. Füge alle Notizen als Nodes hinzu
  notes.forEach((note) => {
    addNoteToGraph(note, graph);
  });

  // 2. Füge Entity-Nodes und Edges hinzu
  notes.forEach((note) => {
    addEntityNodes(note, graph);

    // Füge Topic-Nodes hinzu (falls vorhanden)
    if (topicsMap && topicsMap.has(note.id)) {
      const topics = topicsMap.get(note.id)!;
      addTopicNodes(note, topics, graph);
    }
  });

  // 3. Berechne Similarity-Edges
  notes.forEach((note) => {
    addSimilarityEdges(note, notes, graph);
  });

  console.log("✅ Knowledge Graph built:", {
    totalNodes: graph.nodes.length,
    noteNodes: graph.nodes.filter((n) => n.type === "note").length,
    personNodes: graph.nodes.filter((n) => n.type === "person").length,
    placeNodes: graph.nodes.filter((n) => n.type === "place").length,
    projectNodes: graph.nodes.filter((n) => n.type === "project").length,
    topicNodes: graph.nodes.filter((n) => n.type === "topic").length,
    totalEdges: graph.edges.length,
    similarityEdges: graph.edges.filter((e) => e.type === "similarTo").length,
    mentionEdges: graph.edges.filter((e) => e.type === "mentions").length,
    topicEdges: graph.edges.filter((e) => e.type === "topicOf").length,
  });

  return graph;
}

/**
 * Findet ähnliche Notizen basierend auf dem Graph
 */
export function findSimilarNotesFromGraph(
  noteId: string,
  graph: KnowledgeGraph,
  limit: number = 3
): Array<{ noteId: string; similarity: number; label: string }> {
  const noteNodeId = `note_${noteId}`;

  const similarityEdges = graph.edges
    .filter((e) => e.from === noteNodeId && e.type === "similarTo")
    .sort((a, b) => b.strength - a.strength)
    .slice(0, limit);

  return similarityEdges.map((edge) => {
    const targetNode = graph.nodes.find((n) => n.id === edge.to);
    return {
      noteId: targetNode?.metadata?.noteId || "",
      similarity: edge.strength,
      label: targetNode?.label || "",
    };
  });
}

/**
 * Findet alle Entities (Personen, Orte, Projekte), die mit einer Notiz verbunden sind
 */
export function getEntitiesForNote(
  noteId: string,
  graph: KnowledgeGraph
): {
  persons: string[];
  places: string[];
  projects: string[];
  topics: string[];
} {
  const noteNodeId = `note_${noteId}`;

  const relatedEdges = graph.edges.filter((e) => e.from === noteNodeId);

  const persons: string[] = [];
  const places: string[] = [];
  const projects: string[] = [];
  const topics: string[] = [];

  relatedEdges.forEach((edge) => {
    const targetNode = graph.nodes.find((n) => n.id === edge.to);
    if (!targetNode) return;

    if (targetNode.type === "person") {
      persons.push(targetNode.label);
    } else if (targetNode.type === "place") {
      places.push(targetNode.label);
    } else if (targetNode.type === "project") {
      projects.push(targetNode.label);
    } else if (targetNode.type === "topic") {
      topics.push(targetNode.label);
    }
  });

  return { persons, places, projects, topics };
}

/**
 * Gibt die Top-N Entities nach Häufigkeit zurück
 */
export function getTopEntities(
  graph: KnowledgeGraph,
  type: NodeType,
  limit: number = 10
): Array<{ label: string; count: number }> {
  return graph.nodes
    .filter((n) => n.type === type)
    .map((n) => ({
      label: n.label,
      count: n.metadata?.count || 1,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
