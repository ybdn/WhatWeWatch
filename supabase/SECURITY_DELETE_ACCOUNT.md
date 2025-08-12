# Delete Account Function – Sécurité & Tests

## 1. Résumé

Edge Function `delete-account` : supprime avatar(s) + log audit + supprime l’utilisateur (admin API).

Ajouts sécurité:

- Vérification cryptographique JWT (signature, issuer, audience)
- Timeout JWKS + fallback
- Vérification iat >= updated_at (revocation soft)

## 2. Flux

1. Client envoie POST avec header `Authorization: Bearer <access_token>`
2. Fonction:
-- Vérifie token (signature, iss, aud)
-- (Optionnel) Revocation check vs updated_at
-- Supprime objets storage préfixés `<userId>/`
-- Insère ligne audit `account_deletions`
-- Supprime user via admin `DELETE /auth/v1/admin/users/:id`
3. Réponse `{ status: "ok" }`

## 3. Claims attendus

- `iss = <SUPABASE_URL>/auth/v1`
- `aud` contient `authenticated`
- `sub` = UUID utilisateur

## 4. Codes d’erreur

| Code interne            | HTTP | Description               |
| ----------------------- | ---- | ------------------------- |
| Authorization manquante | 401  | Header absent / mal formé |
| jwks_unreachable        | 503  | Timeout récupération clés |
| jwt_verify_failed       | 401  | Signature / iss invalide  |
| audience_forbidden      | 401  | Aud non autorisée         |
| token_revoked           | 401  | iat < updated_at - skew   |
| sub manquant            | 401  | Claim sub absent          |
| delete user failed      | 500  | Échec suppression admin   |

## 5. Tests curl

Exporter variables:

```bash
ACCESS_TOKEN="<token utilisateur>"
SUPABASE_FN_URL="https://<project-ref>.functions.supabase.co/delete-account"
```

Appel nominal:

```bash
curl -i -X POST \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "$SUPABASE_FN_URL"
```

Token modifié (signature cassée):

```bash
BROKEN="$(echo "$ACCESS_TOKEN" | sed 's/.$/x/')"
curl -i -X POST -H "Authorization: Bearer $BROKEN" "$SUPABASE_FN_URL"
```

Audience forcée (obliger rejet) – nécessite re-générer un token custom si possible.

Timeout JWKS (simulation): couper réseau sortant / changer URL env SUPABASE_URL volontairement.

begin

## 6. Stratégies de suppression données

### A. ON DELETE CASCADE (recommandé si toutes tables réfèrent auth.users)

Assure que chaque FK => `on delete cascade`. Exemple:

```sql
alter table public.profiles
  drop constraint profiles_id_fkey,
  add constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade;
```

Répéter pour tables fils (watch_history, user_lists, etc.).

### B. Fonction RPC transactionnelle (si besoin d’ordre spécifique)

```sql
create or replace function public.delete_user_cascade(p_uid uuid)
returns void language plpgsql security definer as $$

  -- Exemple d'ordre (adapter)
  delete from public.watch_history where user_id = p_uid;
  delete from public.user_lists where user_id = p_uid;
  delete from public.profiles where id = p_uid;
end;$$;
```

Appel côté edge AVANT suppression `auth.users`:

```ts
await fetch(`${SUPABASE_URL}/rest/v1/rpc/delete_user_cascade`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    apikey: SERVICE_ROLE_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ p_uid: userId }),
});
```

## 7. Idempotence

2ᵉ appel après suppression: retournera 200 mais ne supprime rien (utilisateur déjà absent). On peut optionnellement vérifier existence avant et renvoyer 404.

## 8. Améliorations futures

- Rate limiting (ex: Cloudflare, middleware)
- Signature secondaire (HMAC interne) entre app et edge
- Journalisation centralisée (Sentry) erreurs 5xx
- File d’attente différée (grandes purges données)

## 9. Variables d’environnement requises

- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

## 10. Sécurité opérationnelle

- Ne pas laisser `--no-verify-jwt` en prod
- Faire tourner revocation check seulement si usage réel (sinon désactiver)
- Rotation clés: géré côté Supabase JWKS

---

Si besoin d’un script automatisé de tests plus riche (Node ou Deno), ajouter un dossier `supabase/tests/`.
