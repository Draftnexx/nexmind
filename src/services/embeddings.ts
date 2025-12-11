import { Note } from "../types/note";

/**
 * INTELLIGENCE LAYER V2: Similarity Engine
 */

/**
 * Berechnet die Kosinus-Ähnlichkeit zwischen zwei Vektoren
 */
export function calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    magnitude1 += vec1[i] * vec1[i];
    magnitude2 += vec2[i] * vec2[i];
  }

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Findet die ähnlichsten Notizen zu einer gegebenen Notiz
 */
export function findSimilarNotes(
  targetNote: Note,
  allNotes: Note[],
  topN: number = 3
): Array<{ note: Note; similarity: number }> {
  if (!targetNote.embedding) {
    return [];
  }

  const similarities = allNotes
    .filter((note) => note.id !== targetNote.id && note.embedding)
    .map((note) => ({
      note,
      similarity: calculateCosineSimilarity(targetNote.embedding!, note.embedding!),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topN);

  return similarities;
}

/**
 * Berechnet die durchschnittliche Ähnlichkeit zwischen allen Notizen
 */
export function calculateAverageNoteSimilarity(notes: Note[]): number {
  const notesWithEmbeddings = notes.filter((note) => note.embedding);

  if (notesWithEmbeddings.length < 2) {
    return 0;
  }

  let totalSimilarity = 0;
  let count = 0;

  for (let i = 0; i < notesWithEmbeddings.length; i++) {
    for (let j = i + 1; j < notesWithEmbeddings.length; j++) {
      const similarity = calculateCosineSimilarity(
        notesWithEmbeddings[i].embedding!,
        notesWithEmbeddings[j].embedding!
      );
      totalSimilarity += similarity;
      count++;
    }
  }

  return count > 0 ? totalSimilarity / count : 0;
}

/**
 * Findet Cluster von ähnlichen Notizen
 */
export function findNoteClusters(
  notes: Note[],
  similarityThreshold: number = 0.7
): Note[][] {
  const notesWithEmbeddings = notes.filter((note) => note.embedding);
  const clusters: Note[][] = [];
  const assigned = new Set<string>();

  notesWithEmbeddings.forEach((note) => {
    if (assigned.has(note.id)) {
      return;
    }

    const cluster: Note[] = [note];
    assigned.add(note.id);

    notesWithEmbeddings.forEach((otherNote) => {
      if (assigned.has(otherNote.id)) {
        return;
      }

      const similarity = calculateCosineSimilarity(note.embedding!, otherNote.embedding!);

      if (similarity >= similarityThreshold) {
        cluster.push(otherNote);
        assigned.add(otherNote.id);
      }
    });

    if (cluster.length > 1) {
      clusters.push(cluster);
    }
  });

  return clusters;
}
