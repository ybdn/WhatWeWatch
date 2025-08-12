import { supabase as staticSupabase } from "./supabase";

// Permet aux tests d'injecter un mock via global.supabase si le client réel n'est pas initialisé
function getClient() {
  // @ts-ignore
  return staticSupabase || (global as any).supabase || null;
}

// Appelle la fonction edge delete-account (doit être déployée) pour supprimer l'utilisateur courant.
export async function deleteCurrentAccount() {
  const client = getClient();
  if (!client) throw new Error("Supabase indisponible");
  const { data: userData } = await client.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("Utilisateur non authentifié");
  const base = process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL; // ex: https://<ref>.functions.supabase.co
  if (!base) throw new Error("EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL manquant");
  const url = `${base}/delete-account`;
  const session = await client.auth.getSession();
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
