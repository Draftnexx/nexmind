import { supabase } from "../lib/supabaseClient";
import { Note } from "../types/note";

/**
 * Fetches notes from Supabase for a specific user
 * READ-ONLY operation - no writes to Supabase
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
