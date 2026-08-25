# Intégration AtlasMiel

Le site AtlasMiel existant utilise les tables Supabase `products` et `orders`. Le CRM les lit via `GET /api/atlasmiel/products` et crée une commande via `POST /api/atlasmiel/orders` avec la clé service uniquement côté serveur.

Les noms de variables du site existant sont `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY`. Dans CentreAPL, utilisez leurs équivalents Next.js `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Ne copiez jamais la valeur de la clé service dans le dépôt.
