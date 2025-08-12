import { supabase } from "./supabase";

export interface Profile {
  id: string; // uuid (auth.users.id)
  display_name: string | null;
  avatar_url: string | null;
  updated_at: string | null;
  created_at?: string | null;
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, updated_at, created_at")
    .eq("id", userId)
    .single();
  if (error && (error as any).code !== "PGRST116") throw error; // no rows
  return data ?? null;
}

export async function upsertProfile(p: {
  id: string;
  display_name?: string | null;
  avatar_url?: string | null;
}) {
  if (!supabase) return;
  const { error } = await supabase.from("profiles").upsert({
    id: p.id,
    display_name: p.display_name ?? null,
    avatar_url: p.avatar_url ?? null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function ensureProfile(userId: string) {
  const existing = await fetchProfile(userId);
  if (!existing) {
    await upsertProfile({ id: userId, display_name: null, avatar_url: null });
    return fetchProfile(userId);
  }
  return existing;
}
