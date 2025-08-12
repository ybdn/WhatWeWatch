// Edge Function (Deno) pour supprimer un compte utilisateur
// Déploiement : `supabase functions deploy delete-account --no-verify-jwt`
// (Activer ensuite la vérification JWT si nécessaire.)
// Utilise maintenant l'API native Deno.serve (pas besoin d'import std/http)
// ATTENTION: nécessite la service role key; ajouter une vérification JWT stricte avant prod.

// Déclaration minimale si l'éditeur local n'a pas les types Deno (retirez si IDE gère Deno).
declare const Deno: any;

interface JwtPayload {
  sub?: string;
  [k: string]: any;
}

function extractUserId(authHeader: string): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7);
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(atob(parts[1])) as JwtPayload;
    return payload.sub || null;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST requis" }), {
      status: 405,
    });
  }
  try {
    const authHeader = req.headers.get("authorization") || "";
    const userId = extractUserId(authHeader);
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "JWT utilisateur invalide" }),
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
