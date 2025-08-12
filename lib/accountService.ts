import { supabase } from "./supabase";

// Appelle la fonction edge delete-account (doit être déployée) pour supprimer l'utilisateur courant.
export async function deleteCurrentAccount() {
  if (!supabase) throw new Error("Supabase indisponible");
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("Utilisateur non authentifié");
  const base = process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL; // ex: https://<ref>.functions.supabase.co
  if (!base) throw new Error("EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL manquant");
  const url = `${base}/delete-account`;
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error("Suppression échouée: " + text);
  }
  return true;
}
