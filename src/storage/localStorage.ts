import { Note, ChatMessage, TaskStatus, TaskPriority } from "../types/note";

const NOTES_KEY = "nexmind_notes";
const CHAT_KEY = "nexmind_chat";

/**
 * Lädt alle Notizen aus dem localStorage
 */
export function loadNotes(): Note[] {
  try {
    const stored = localStorage.getItem(NOTES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading notes from localStorage:", error);
  }
  return [];
}

/**
 * Speichert alle Notizen im localStorage
 */
export function saveNotes(notes: Note[]): void {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch (error) {
    console.error("Error saving notes to localStorage:", error);
  }
}

/**
 * Fügt eine neue Notiz hinzu
 */
export function addNote(note: Note): Note[] {
  const notes = loadNotes();
  notes.unshift(note); // Am Anfang einfügen
  saveNotes(notes);
  return notes;
}

/**
 * Aktualisiert eine bestehende Notiz
 */
export function updateNote(id: string, updates: Partial<Note>): Note[] {
  const notes = loadNotes();
  const index = notes.findIndex(note => note.id === id);

  if (index !== -1) {
    notes[index] = {
      ...notes[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveNotes(notes);
  }

  return notes;
}

/**
 * Löscht eine Notiz
 */
export function deleteNote(id: string): Note[] {
  const notes = loadNotes();
  const filtered = notes.filter(note => note.id !== id);
  saveNotes(filtered);
  return filtered;
}

/**
 * Holt Notizen nach Kategorie
 */
export function getNotesByCategory(category: string): Note[] {
  const notes = loadNotes();
  return notes.filter(note => note.category === category);
}

/**
 * Sucht Notizen nach Text
 */
export function searchNotes(query: string): Note[] {
  const notes = loadNotes();
  const lowerQuery = query.toLowerCase();
  return notes.filter(note =>
    note.content.toLowerCase().includes(lowerQuery)
  );
}

// Chat-Funktionen

/**
 * Lädt Chat-Verlauf
 */
export function loadChatMessages(): ChatMessage[] {
  try {
    const stored = localStorage.getItem(CHAT_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading chat from localStorage:", error);
  }
  return [];
}

/**
 * Speichert Chat-Verlauf
 */
export function saveChatMessages(messages: ChatMessage[]): void {
  try {
    localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error("Error saving chat to localStorage:", error);
  }
}

/**
 * Fügt eine Chat-Nachricht hinzu
 */
export function addChatMessage(message: ChatMessage): ChatMessage[] {
  const messages = loadChatMessages();
  messages.push(message);
  saveChatMessages(messages);
  return messages;
}

// Productivity Intelligence V4: Task Management Functions

/**
 * Updates task status
 */
export function updateTaskStatus(noteId: string, status: TaskStatus): Note[] {
  return updateNote(noteId, { status });
}

/**
 * Updates task priority
 */
export function updateTaskPriority(noteId: string, priority: TaskPriority): Note[] {
  return updateNote(noteId, { priority });
}

/**
 * Updates task due date
 */
export function updateTaskDueDate(noteId: string, dueDate: string | null): Note[] {
  return updateNote(noteId, { dueDate });
}

/**
 * Gets all tasks (notes with category "task")
 */
export function getTasks(): Note[] {
  const notes = loadNotes();
  return notes.filter(note => note.category === "task");
}

/**
 * Gets tasks by status
 */
export function getTasksByStatus(status: TaskStatus): Note[] {
  return getTasks().filter(task => (task.status || "open") === status);
}

/**
 * Gets tasks by priority
 */
export function getTasksByPriority(priority: TaskPriority): Note[] {
  return getTasks().filter(task => (task.priority || "medium") === priority);
}

/**
 * Gets overdue tasks
 */
export function getOverdueTasks(): Note[] {
  const today = new Date().toISOString().split('T')[0];
  return getTasks().filter(task => {
    if (!task.dueDate || (task.status || "open") === "done") return false;
    return task.dueDate < today;
  });
}

/**
 * Gets tasks due today
 */
export function getTasksDueToday(): Note[] {
  const today = new Date().toISOString().split('T')[0];
  return getTasks().filter(task => {
    if ((task.status || "open") === "done") return false;
    return task.dueDate === today;
  });
}

/**
 * Gets open tasks (not done)
 */
export function getOpenTasks(): Note[] {
  return getTasks().filter(task => (task.status || "open") !== "done");
}
