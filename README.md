# CentreAPL CRM

CRM web responsive pour le centre d’appel AtlasMiel, inspiré des parcours GoAutoDial v4.0 mais sans aucune téléphonie intégrée.

## Règle téléphonique

Le bouton d’appel génère uniquement un lien `tel:`. L’agent passe l’appel avec son téléphone, puis enregistre le résultat, la note et le rappel dans le CRM. Asterisk, SIP, WebRTC, enregistrement audio et composeur automatique ne font pas partie du projet.

## Démarrage

1. Copier `.env.example` vers `.env.local`.
2. Renseigner l’URL et la clé publique du même projet Supabase qu’AtlasMiel (`VITE_SUPABASE_URL` devient `NEXT_PUBLIC_SUPABASE_URL`, et `VITE_SUPABASE_PUBLISHABLE_KEY` devient `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
3. Renseigner `ATLASMIEL_SUPABASE_URL` et `ATLASMIEL_SUPABASE_ANON_KEY`. Les commandes passent par les règles RLS publiques déjà utilisées par AtlasMiel ; aucune clé service-role n'est nécessaire.
4. Appliquer `supabase/migrations/202608250001_crm.sql` dans le SQL Editor Supabase.
5. Installer puis lancer : `npm install`, `npm run dev`.

## Déploiement GitHub Pages

Le CRM utilise des Route Handlers et Supabase Auth ; il doit être déployé sur un runtime Node (Vercel, Render ou hébergement Next.js). GitHub Pages seul ne peut pas exécuter les routes serveur ni protéger les clés Supabase.
