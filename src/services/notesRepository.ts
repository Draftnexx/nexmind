import { supabase } from "../lib/supabaseClient";
import { Note } from "../types/note";

/**
 * Fetches notes from Supabase for a specific user
 * Maps Supabase schema fields to TypeScript Note interface
 */
export async function fetchNotesFromSupabase(userId: string): Promise<Note[]> {
  try {
    const { data, error } = await supabase
      .from("notes")
      .select("id, user_id, content, type, status, priority")
      .eq("user_id", userId)
      .order("id", { ascending: false }); // Order by id since no created_at

    if (error) {
      console.error("❌ Error fetching notes from Supabase:", error.message);
      return [];
    }

    if (!data) {
      return [];
    }

    // Map Supabase schema to TypeScript Note interface
    const notes: Note[] = data.map((row: any) => ({
      id: row.id,
      content: row.content,
      category: row.type,  // type → category mapping
      status: row.status ?? undefined,
      priority: row.priority ?? undefined,
      createdAt: new Date().toISOString(), // No created_at in schema, use current time
      // Fields not in Supabase schema - set to undefined
      updatedAt: undefined,
      entities: undefined,
      embedding: undefined,
      categoryConfidence: undefined,
      categoryReason: undefined,
      relatedNoteIds: undefined,
      dueDate: undefined,
    }));

    console.log(`✅ Fetched ${notes.length} notes from Supabase`);
    return notes;
  } catch (err) {
    console.error("❌ Unexpected error fetching notes:", err);
    return [];
  }
}

/**
 * Adds a new note to Supabase
 * ONLY writes fields that exist in the notes table schema
 */
export async function addNoteToSupabase(userId: string, note: Note): Promise<boolean> {
  // ========================
  // VALIDATION: NOT NULL FIELDS
  // ========================
  if (!note.content || !note.category || !userId) {
    console.error("❌ VALIDATION ERROR: Missing required fields", {
      hasContent: !!note.content,
      hasCategory: !!note.category,
      hasUserId: !!userId,
    });
    return false;
  }

  // ========================
  // PREPARE PAYLOAD - ONLY SCHEMA FIELDS
  // ========================
  const payload = {
    user_id: userId,              // NOT NULL
    content: note.content,        // NOT NULL
    type: note.category,          // NOT NULL (category → type mapping)
    status: note.status ?? null,     // NULLABLE
    priority: note.priority ?? null, // NULLABLE
  };

  console.log("📤 INSERT notes payload:", payload);

  try {
    const { error } = await supabase.from("notes").insert(payload);

    if (error) {
      console.error("❌ SUPABASE INSERT ERROR:", error);
      return false;
    }

    console.log(`✅ Note added to Supabase: ${note.id} (type: ${payload.type})`);
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
 * ONLY updates fields that exist in the notes table schema
 */
export async function updateNoteInSupabase(userId: string, note: Partial<Note> & { id: string }): Promise<boolean> {
  // ========================
  // PREPARE UPDATE PAYLOAD - ONLY SCHEMA FIELDS
  // ========================
  const payload: Record<string, any> = {};

  if (note.content !== undefined) payload.content = note.content;
  if (note.category !== undefined) payload.type = note.category; // category → type mapping
  if (note.status !== undefined) payload.status = note.status ?? null;
  if (note.priority !== undefined) payload.priority = note.priority ?? null;

  // If nothing to update, skip
  if (Object.keys(payload).length === 0) {
    console.warn("⚠️ UPDATE skipped: No valid fields to update");
    return true;
  }

  console.log("📤 UPDATE notes payload:", payload);

  try {
    const { error } = await supabase
      .from("notes")
      .update(payload)
      .eq("id", note.id)
      .eq("user_id", userId); // Ensure user owns the note

    if (error) {
      console.error("❌ SUPABASE UPDATE ERROR:", error);
      return false;
    }

    console.log(`✅ Note updated in Supabase: ${note.id}`);
    return true;
  } catch (err) {
    console.error("❌ Unexpected error updating note:", err);
    return false;
  }
}
