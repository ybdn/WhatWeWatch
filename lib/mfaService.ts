import { supabase } from "./supabase";

// Service utilitaire pour MFA TOTP (selon supabase-js v2 factors API)
export async function listFactors() {
  if (!supabase) return [] as any[];
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  // data.totp factors généralement sous data.totp (array)
  return data?.totp || [];
}

export async function enrollTotpFactor() {
  if (!supabase) throw new Error("Supabase indisponible");
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
  });
  if (error) throw error;
  return data; // contient id + secret + uri otpauth
}

export async function verifyTotpFactor(
  factorId: string,
  challengeId: string,
  code: string
) {
  if (!supabase) throw new Error("Supabase indisponible");
  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId,
    code,
  });
  if (error) throw error;
  return data;
}

export async function challengeTotpFactor(factorId: string) {
  if (!supabase) throw new Error("Supabase indisponible");
  const { data, error } = await supabase.auth.mfa.challenge({ factorId });
  if (error) throw error;
  return data; // returns challenge id
}

export async function deleteTotpFactor(factorId: string) {
  if (!supabase) throw new Error("Supabase indisponible");
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw error;
}
