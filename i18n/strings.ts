export const strings = {
  fr: {
    auth: {
      loginTitle: "Connexion",
      loginButton: "Se connecter",
      loginButtonPending: "Connexion…",
      registerTitle: "Inscription",
      registerButton: "Créer le compte",
      registerButtonPending: "Création…",
      passwordPlaceholder: "Mot de passe",
      passwordPlaceholderRegister: "Mot de passe (8+ avec diversité)",
      emailPlaceholder: "Email",
      forgotPassword: "Mot de passe oublié ?",
      resetLink: "Réinitialiser",
      noAccount: "Pas de compte ?",
      signup: "Inscription",
      haveAccount: "Déjà un compte ?",
      signin: "Connexion",
      sendLink: "Envoyer le lien",
      sendLinkPending: "Envoi…",
      resetDone: "Si l'email existe, un lien de réinitialisation a été envoyé.",
      returnLogin: "Retour connexion",
      cancel: "Annuler",
      invalidEmailFormat: "Format email invalide",
      invalidCredentials: "Identifiants invalides",
      passwordShow: "Afficher",
      passwordHide: "Masquer",
      registerSuccess: "Compte créé. Vérifie ton email.",
      registerErrorGeneric: "Erreur d'inscription",
      registerErrorToast: "Erreur inscription",
      invalidEmail: "Email invalide",
    },
  },
};

export const locale = "fr"; // futur: détection dynamique

export function t(path: string): string {
  const parts = path.split(".");
  let cur: any = strings[locale as keyof typeof strings];
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in cur) cur = cur[p];
    else return path; // fallback sur la clé brute
  }
  return typeof cur === "string" ? cur : path;
}

export const tAuth = (k: string) => t(`auth.${k}`);
