import { supabase as staticSupabase } from "./supabase";

function getClient() {
  // @ts-ignore
  return staticSupabase || (global as any).supabase || null;
}

// Service utilitaire pour MFA TOTP (selon supabase-js v2 factors API)
export async function listFactors() {
  const client = getClient();
  if (!client) return [] as any[];
  const { data, error } = await client.auth.mfa.listFactors();
  if (error) throw error;
  // data.totp factors généralement sous data.totp (array)
  return data?.totp || [];
}

export async function enrollTotpFactor() {
  const client = getClient();
  if (!client) throw new Error("Supabase indisponible");
  const { data, error } = await client.auth.mfa.enroll({
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
  const client = getClient();
  if (!client) throw new Error("Supabase indisponible");
  const { data, error } = await client.auth.mfa.verify({
    factorId,
    challengeId,
    code,
  });
  if (error) throw error;
  return data;
}

export async function challengeTotpFactor(factorId: string) {
  const client = getClient();
  if (!client) throw new Error("Supabase indisponible");
  const { data, error } = await client.auth.mfa.challenge({ factorId });
  if (error) throw error;
  return data; // returns challenge id
}

export async function deleteTotpFactor(factorId: string) {
  const client = getClient();
  if (!client) throw new Error("Supabase indisponible");
  const { error } = await client.auth.mfa.unenroll({ factorId });
  if (error) throw error;
}
