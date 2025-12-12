import { supabase } from "../lib/supabaseClient";
import { Note } from "../types/note";

/**
 * One-time migration from localStorage to Supabase
 * Uses a flag to ensure migration only runs once
 */
export async function migrateLocalNotesToSupabase(userId: string): Promise<void> {
  console.log("🔄 Checking migration status...");

  // Check if migration already completed
  const migrated = localStorage.getItem("nexmind_migrated_v1");
  if (migrated === "true") {
    console.log("✅ Migration already completed - skipping");
    return;
  }

  // Get local notes
  const raw = localStorage.getItem("notes");
  if (!raw) {
    console.log("ℹ️ No local notes found - marking migration as complete");
    localStorage.setItem("nexmind_migrated_v1", "true");
    return;
  }

  let notes: Note[];
  try {
    notes = JSON.parse(raw);
  } catch (error) {
    console.error("❌ Error parsing local notes:", error);
    localStorage.setItem("nexmind_migrated_v1", "true");
    return;
  }

  if (notes.length === 0) {
    console.log("ℹ️ No notes to migrate - marking migration as complete");
    localStorage.setItem("nexmind_migrated_v1", "true");
    return;
  }

  console.log(`🚀 Starting migration of ${notes.length} notes to Supabase...`);

  let successCount = 0;
  let errorCount = 0;

  for (const note of notes) {
    try {
      // Map Note interface to Supabase schema
      const { error } = await supabase.from("notes").insert({
        id: note.id, // Keep original ID
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
        console.error(`❌ Error migrating note ${note.id}:`, error.message);
        errorCount++;
      } else {
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Unexpected error migrating note ${note.id}:`, err);
      errorCount++;
    }
  }

  console.log(`✅ Migration complete: ${successCount} successful, ${errorCount} errors`);

  // Mark migration as complete
  localStorage.setItem("nexmind_migrated_v1", "true");

  if (successCount > 0) {
    console.log(`📦 ${successCount} notes are now in Supabase`);
  }
}
