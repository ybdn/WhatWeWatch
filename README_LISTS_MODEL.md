# Modèle de données Listes (MVP)

Tables créées (script `supabase/20250813_lists_model.sql`):

- lists: métadonnées de liste (owner, privacy)
- list_items: éléments (film/série) + position + added_by
- list_collaborators: droits d'édition/lecture (role: editor|viewer)

RLS: owner + collaborateurs ont accès complet; lecture publique si `is_private=false`.

Vues: `list_with_counts` pour compter items/collaborateurs.

## Événements analytics Explore (actuels)

- explore_impression { sections }
- explore_search { q_len, results, has_results }
- explore_search_empty { q_len }
- explore_search_error { q_len }
- explore_click_result { id }
- explore_click_item { from_section, id }
- explore_click_collection_item { id }

## Prochaines étapes possibles

1. Ajouter endpoint backend pour Top / Tendances réels.
2. Ajouter pagination résultats search.
3. Implémenter services supabase pour CRUD listes.
4. Instrumenter events liés aux listes (create/update/add_item/remove_item/open_list).
