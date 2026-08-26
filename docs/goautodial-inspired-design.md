# CentreAPL CRM — interface inspirée de GOautodial sans téléphonie

## Objectif

Reproduire les parcours utiles d’un centre de contact GOautodial pour AtlasMiel : campagnes, listes de prospects, espace agent, scripts, suivi d’appels et supervision. Le système reste un CRM manuel : le bouton Appeler ouvre uniquement `tel:`.

## Fonctionnalités incluses

- Authentification Supabase et rôles Admin/Agent.
- Tableau de bord supervision : clients, appels, résultats, rappels, ventes et performance par agent.
- Campagnes avec statut, script, liste de prospects, affectations et progression réelle.
- Import CSV avec aperçu, mapping des colonnes, validation et rapport d’erreurs.
- Espace agent : file de clients attribués, recherche, filtres, fiche client et historique.
- Fiche client : informations, notes, résultats d’appel, rappels et commande AtlasMiel.
- Bouton manuel `tel:` sans API téléphonique.
- Rapports filtrables et export CSV.

## Fonctionnalités explicitement exclues

Asterisk, SIP, PBX, WebRTC, predictive/auto dialer, ACD/queues téléphoniques, écoute/enregistrement audio, whisper/barge-in, routage d’appels et toute numérotation automatique.

## Architecture

Next.js App Router et TypeScript pour l’interface et les Route Handlers. Supabase Auth fournit la session ; PostgreSQL stocke utilisateurs, agents, campagnes, clients, affectations, appels, résultats, notes et rappels. Les politiques RLS limitent les agents à leurs affectations. Un client Supabase séparé lit les produits et crée les commandes dans la base AtlasMiel existante.

## Flux principal agent

1. L’agent se connecte.
2. La file ne contient que ses clients actifs.
3. Il ouvre une fiche et clique sur `tel:`.
4. Après l’appel manuel, il choisit un résultat, ajoute une note et programme éventuellement un rappel.
5. Une vente peut créer une commande AtlasMiel depuis la même fiche.

## Critères d’acceptation

- Aucune donnée de démonstration dans l’interface.
- Une base vide affiche des états vides explicites.
- Un agent ne voit jamais les clients ou actions d’un autre agent via l’interface ou l’API.
- Aucun package, endpoint ou permission téléphonique n’est requis pour lancer l’application.
- Les indicateurs du tableau de bord sont calculés depuis PostgreSQL, jamais depuis des constantes.
