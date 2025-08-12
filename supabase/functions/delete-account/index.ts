// Import JOSE (Deno remote). Tooling local peut signaler une erreur de résolution; exécution Deno OK.
// @ts-ignore URL Deno
import {
  createLocalJWKSet,
  createRemoteJWKSet,
  JWK,
  jwtVerify,
} from "https://deno.land/x/jose@v4.14.4/index.ts";

// Edge Function (Deno) pour supprimer un compte utilisateur
// Déploiement : `supabase functions deploy delete-account --no-verify-jwt`
// (Puis activer la vérification JWT côté plateforme si souhaité.)
// Vérification JWT cryptographique (signature + iss + aud) ajoutée avec jose.
// ATTENTION: nécessite la service role key; protéger cet endpoint (ne pas laisser --no-verify-jwt en prod).

// Déclaration minimale si l'éditeur local n'a pas les types Deno (retirez si IDE gère Deno).
// --- Vérification JWT (iss + aud) ---

declare const Deno: any;

// --- Sécurité JWT avancée: timeout, fallback, revocation, audiences multiples ---
const JWKS_TIMEOUT_MS = 2000;
const CLOCK_SKEW_SEC = 30;
const ALLOWED_AUDIENCES = ["authenticated"]; // étendre si nécessaire
const ENABLE_REVOCATION_CHECK = true;

let remoteJwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let localJwks: ReturnType<typeof createLocalJWKSet> | null = null;

async function fetchJwksWithTimeout(supabaseUrl: string) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), JWKS_TIMEOUT_MS);
  try {
    const resp = await fetch(`${supabaseUrl}/auth/v1/keys`, {
      signal: controller.signal,
    });
    if (!resp.ok) throw new Error(`JWKS status ${resp.status}`);
    const json = await resp.json();
    if (!json.keys) throw new Error("Format JWKS invalide");
    return json;
  } finally {
    clearTimeout(id);
  }
}

async function ensureJwks(supabaseUrl: string) {
  if (!remoteJwks)
    remoteJwks = createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/keys`));
  if (!localJwks) {
    try {
      const jwksJson = await fetchJwksWithTimeout(supabaseUrl);
      localJwks = createLocalJWKSet(jwksJson as { keys: JWK[] });
    } catch {
      // fallback silencieux: on utilisera remoteJwks
    }
  }
}

async function verifyAccessToken(
  token: string,
  supabaseUrl: string,
  serviceRoleKey: string
) {
  await ensureJwks(supabaseUrl);
  const expectedIssuer = `${supabaseUrl}/auth/v1`;
  let payload: any;
  const verifiers = [localJwks, remoteJwks].filter(Boolean) as ReturnType<
    typeof createRemoteJWKSet
  >[];
  let lastErr: Error | null = null;
  for (const v of verifiers) {
    try {
      const r = await jwtVerify(token, v, { issuer: expectedIssuer });
      payload = r.payload;
      lastErr = null;
      break;
    } catch (e) {
      lastErr = e as Error;
    }
  }
  if (!payload) {
    if (lastErr?.name === "AbortError")
      throw Object.assign(new Error("jwks_unreachable"), { status: 503 });
    throw Object.assign(new Error("jwt_verify_failed"), {
      status: 401,
      details: lastErr?.message,
    });
  }
  // Audience
  const aud = payload.aud;
  if (ALLOWED_AUDIENCES.length) {
    const ok = Array.isArray(aud)
      ? aud.some((a) => ALLOWED_AUDIENCES.includes(a))
      : ALLOWED_AUDIENCES.includes(aud as string);
    if (!ok)
      throw Object.assign(new Error("audience_forbidden"), { status: 401 });
  }
  // Revocation (iat >= updated_at - skew)
  if (ENABLE_REVOCATION_CHECK && payload.sub) {
    try {
      const userResp = await fetch(
        `${supabaseUrl}/auth/v1/admin/users/${payload.sub}`,
        {
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            apikey: serviceRoleKey,
          },
        }
      );
      if (userResp.ok) {
        const userJson = await userResp.json();
        const updatedAt = Date.parse(
          userJson?.user?.updated_at || userJson?.updated_at || ""
        );
        if (updatedAt && payload.iat) {
          const updatedSec = Math.floor(updatedAt / 1000) - CLOCK_SKEW_SEC;
          if ((payload.iat as number) < updatedSec)
            throw Object.assign(new Error("token_revoked"), { status: 401 });
        }
      }
    } catch (e) {
      if ((e as any)?.status === 401) throw e; // revocation détectée
      // sinon soft fail
    }
  }
  return payload;
}

// (Interface JwtPayload supprimée: non utilisée depuis vérification cryptographique.)

// Ancienne extraction (décodage base64) supprimée au profit de la vérification ci-dessus.

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST requis" }), {
      status: 405,
    });
  }
  try {
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authorization manquante" }),
        { status: 401 }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Config manquante" }), {
        status: 500,
      });
    }

    let userId: string | null = null;
    try {
      const token = authHeader.substring(7);
      const payload = await verifyAccessToken(
        token,
        SUPABASE_URL,
        SERVICE_ROLE_KEY
      );
      userId = (payload.sub as string) || null;
    } catch (e) {
      const status = (e as any)?.status || 401;
      const code = (e as Error).message;
      if (code === "jwks_unreachable") {
        return new Response(JSON.stringify({ error: code }), { status });
      }
      return new Response(
        JSON.stringify({
          error: "JWT invalide",
          code,
          details: (e as any)?.details || undefined,
        }),
        { status }
      );
    }
    if (!userId)
      return new Response(JSON.stringify({ error: "sub manquant" }), {
        status: 401,
      });

    // Lister fichiers avatar sous public/<userId>/
    const listResp = await fetch(
      `${SUPABASE_URL}/storage/v1/object/list/public`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          apikey: SERVICE_ROLE_KEY,
        },
        body: JSON.stringify({ prefix: `${userId}/` }),
      }
    );
    if (!listResp.ok) {
      const t = await listResp.text();
      console.warn("list storage error", t);
    } else {
      const files = await listResp.json();
      const names: string[] = files.map((f: any) => f.name);
      if (names.length) {
        await fetch(`${SUPABASE_URL}/storage/v1/object/public`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
            apikey: SERVICE_ROLE_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(names.map((n) => `${userId}/${n}`)),
        });
      }
    }

    // Audit log (table 'account_deletions' avec colonnes: user_id UUID, created_at timestamptz default now())
    await fetch(`${SUPABASE_URL}/rest/v1/account_deletions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ user_id: userId }),
    }).catch(() => {
      /* ignore log failure */
    });

    // Suppression utilisateur (admin)
    const delUser = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users/${userId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          apikey: SERVICE_ROLE_KEY,
        },
      }
    );
    if (!delUser.ok) {
      const t = await delUser.text();
      return new Response(
        JSON.stringify({ error: "delete user failed", details: t }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
    });
  }
});
