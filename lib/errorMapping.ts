// Map raw Supabase / network errors to user-friendly French messages
export function mapAuthError(e: any): string {
  const msg = e?.message || "Erreur inattendue";
  const lower = msg.toLowerCase();
  if (lower.includes("invalid login credentials"))
    return "Identifiants invalides";
  if (lower.includes("email not confirmed")) return "Email non confirmé";
  if (lower.includes("rate limit"))
    return "Trop de tentatives, réessaie plus tard";
  if (lower.includes("password")) return "Mot de passe invalide";
  if (lower.includes("already registered")) return "Email déjà enregistré";
  if (lower.includes("user already exists")) return "Email déjà enregistré";
  return msg;
}
