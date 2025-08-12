// Simple password scoring (0-4)
// Score rules:
// +1 longueur >= 8
// +1 contient chiffre
// +1 contient lettre majuscule ou minuscule (au moins une de chaque type maj/min ajoute 1 supplémentaire)
// +1 caractère spécial
export function passwordScore(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++; // diversité casse
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

export function passwordHints(pw: string): string[] {
  const hints: string[] = [];
  if (pw.length < 8) hints.push("Au moins 8 caractères");
  if (!/[0-9]/.test(pw)) hints.push("Un chiffre");
  if (!(/[a-z]/.test(pw) && /[A-Z]/.test(pw)))
    hints.push("Majuscule et minuscule");
  if (!/[^A-Za-z0-9]/.test(pw)) hints.push("Un symbole");
  return hints;
}
