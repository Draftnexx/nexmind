import { supabase } from "../lib/supabaseClient";
import { Note } from "../types/note";

/**
 * Fetches notes from Supabase for a specific user
 */
export async function fetchNotesFromSupabase(userId: string): Promise<Note[]> {
  try {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching notes from Supabase:", error.message);
      return [];
    }

    console.log(`✅ Fetched ${data?.length ?? 0} notes from Supabase`);
    return data ?? [];
  } catch (err) {
    console.error("❌ Unexpected error fetching notes:", err);
    return [];
  }
}

/**
 * Adds a new note to Supabase
 */
export async function addNoteToSupabase(userId: string, note: Note): Promise<boolean> {
  try {
    const { error } = await supabase.from("notes").insert({
      id: note.id,
      user_id: userId,
      content: note.content,
      category: note.category,
      created_at: note.createdAt,
      updated_at: note.updatedAt ?? null,

      // Task-specific fields
      status: note.status ?? null,
      priority: note.priority ?? null,
      due_date: note.dueDate ?? null,

      // Entities (stored as JSON)
      entities: note.entities ?? null,

      // AI metadata
      embedding: note.embedding ?? null,
      category_confidence: note.categoryConfidence ?? null,
      category_reason: note.categoryReason ?? null,
    });

    if (error) {
      console.error("❌ Error adding note to Supabase:", error.message);
      return false;
    }

    console.log(`✅ Note added to Supabase: ${note.id}`);
    return true;
  } catch (err) {
    console.error("❌ Unexpected error adding note:", err);
    return false;
  }
}

/**
 * Deletes a note from Supabase
 */
export async function deleteNoteFromSupabase(userId: string, noteId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", noteId)
      .eq("user_id", userId); // Ensure user owns the note

    if (error) {
      console.error("❌ Error deleting note from Supabase:", error.message);
      return false;
    }

    console.log(`✅ Note deleted from Supabase: ${noteId}`);
    return true;
  } catch (err) {
    console.error("❌ Unexpected error deleting note:", err);
    return false;
  }
}

/**
 * Updates a note in Supabase
 */
export async function updateNoteInSupabase(userId: string, note: Partial<Note> & { id: string }): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notes")
      .update({
        content: note.content,
        category: note.category,
        updated_at: new Date().toISOString(),

        // Task-specific fields
        status: note.status ?? null,
        priority: note.priority ?? null,
        due_date: note.dueDate ?? null,

        // Entities
        entities: note.entities ?? null,

        // AI metadata
        embedding: note.embedding ?? null,
        category_confidence: note.categoryConfidence ?? null,
        category_reason: note.categoryReason ?? null,
      })
      .eq("id", note.id)
      .eq("user_id", userId); // Ensure user owns the note

    if (error) {
      console.error("❌ Error updating note in Supabase:", error.message);
      return false;
    }

    console.log(`✅ Note updated in Supabase: ${note.id}`);
    return true;
  } catch (err) {
    console.error("❌ Unexpected error updating note:", err);
    return false;
  }
}
