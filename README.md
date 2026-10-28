# 📦 Réception colis

Application web légère pour suivre les colis reçus à l’accueil et organiser leur remise à leurs destinataires.

**Application en production :** [https://colis-app-six.vercel.app](https://colis-app-six.vercel.app)

## Contexte

L’outil vise un accueil qui traite environ **10 colis par jour**. L’agent de réception enregistre les arrivées, puis informe les destinataires, qui peuvent être des personnes externes à l’organisation. L’interface est conçue pour être utilisée simplement depuis un navigateur, sur ordinateur comme sur téléphone.

## Fonctionnalités réalisées

- Création d’une fiche avec numéro de suivi, transporteur, destinataire, e-mail, société, expéditeur et notes.
- Détection indicative de plusieurs transporteurs à partir du numéro de suivi, avec possibilité de choisir le transporteur dans le formulaire.
- Recherche dans les numéros de suivi, destinataires, sociétés, expéditeurs et transporteurs; filtres et compteurs par statut.
- Mémorisation locale des contacts pour faciliter les saisies suivantes.
- Préparation d’un message de notification à personnaliser, à copier ou à ouvrir dans la messagerie de l’utilisateur. L’agent confirme ensuite l’envoi dans l’application.
- Enregistrement de la remise, avec signature dessinée sur écran tactile/souris ou validation sans signature.
- Paramétrage local du nom de l’organisation, du lieu, des horaires et de la signature des e-mails.
- Import JSON et export en sauvegarde JSON ou tableau CSV.
- Affichage des dates de réception, notification et remise; suppression d’une fiche avec confirmation.

## Choix techniques et état du projet

L’interface est en **HTML, CSS et JavaScript natifs**, sans étape de compilation. `manifest.json` pose une première base **PWA**. Les données et paramètres sont actuellement conservés dans le `localStorage` du navigateur : ils ne sont donc pas synchronisés entre appareils ni utilisateurs.

Le déploiement de l’interface est prévu sur **Vercel**. Une connexion à **Notion** pour stocker les colis et un envoi d’e-mails avec **Resend** sont prévus mais **pas encore implémentés**. Les variables d’exemple sont dans `.env.example`; un fichier d’exemple n’est pas un stockage de secrets. Le jeton Notion devra être utilisé uniquement côté serveur, jamais dans le code livré au navigateur.

> Les icônes PWA et le service worker ne sont pas inclus dans ce dépôt pour l’instant : **à faire**.

## Arborescence

```text
colis-app/
├── public/
│   ├── index.html       # Interface HTML et formulaires
│   ├── app.js           # Comportements, stockage local et interactions
│   ├── style.css        # Présentation responsive
│   └── manifest.json    # Métadonnées PWA (icônes à ajouter)
├── .env.example         # Noms des variables prévues, valeurs vides
├── .gitignore           # Fichiers et secrets à ne pas versionner
├── install.bat          # Lancement sous Windows
├── install.sh           # Lancement sous Linux/macOS
├── LICENSE              # Licence MIT; titulaire à compléter
├── package.json         # Métadonnées et commande start
└── README.md            # Documentation du projet
```

## Installation et lancement

### Windows (par exemple `C:\projets\colis-app`)

1. Installer **Node.js**, qui fournit `node` et `npx` : [nodejs.org](https://nodejs.org/).
2. Placer le projet dans `C:\projets\colis-app`.
3. Double-cliquer sur `install.bat` ou l’exécuter depuis l’invite de commandes.
4. Le script se place dans le dossier du projet, vérifie Node.js et `npx`, lance `npx serve public` et ouvre [http://localhost:3000](http://localhost:3000). Garder la fenêtre du serveur ouverte pendant l’utilisation.

### Linux/macOS

Depuis le dossier du projet :

```sh
./install.sh
```

Le script vérifie `node` et `npx`, lance le serveur local et tente d’ouvrir le navigateur.

### Lancement manuel

Avec Node.js installé, depuis la racine du dépôt :

```sh
npx serve public
```

Ouvrir ensuite [http://localhost:3000](http://localhost:3000). Pour voir les changements après modification des fichiers, effectuer un rechargement forcé avec **Ctrl+F5** (ou l’équivalent du navigateur).

## Déploiement sur Vercel

Le projet est une interface statique. Depuis la racine du dépôt, installer la CLI Vercel si nécessaire, puis :

```sh
vercel login
vercel --prod
```

Lors de la configuration, définir `public/` comme répertoire de sortie statique si Vercel le demande. L’URL de production actuellement indiquée pour l’application est [https://colis-app-six.vercel.app](https://colis-app-six.vercel.app). Les fonctions serveur et variables d’environnement de la feuille de route ne sont pas encore livrées; ne pas y saisir de secrets tant que leur usage côté serveur n’est pas en place.

## Cycle de traitement

```text
Recu  →  Notifie  →  Remis
```

- **Recu** : statut affecté à la création d’un colis.
- **Notifie** : après préparation de la notification, l’agent utilise « C’est envoyé » pour confirmer et enregistrer la date. L’application ne transmet pas elle-même l’e-mail aujourd’hui.
- **Remis** : l’agent valide la remise, avec signature dessinée si souhaité, ou sans signature.

Un colis peut aussi être marqué directement **Remis** depuis les statuts `Recu` ou `Notifie`.

## Schéma Notion prévu

Proposition de propriétés pour une future base Notion (noms sans accents). Les types sont à ajuster lors de l’intégration; aucun connecteur Notion n’est actuellement présent dans `app.js`.

| Propriete | Type Notion envisage | Utilisation |
|---|---|---|
| `suivi` | Title | Numero de suivi, identifiant lisible |
| `transporteur` | Select | Transporteur |
| `expediteur` | Rich text | Expediteur |
| `destinataire` | Rich text | Nom du destinataire |
| `email` | Email | Adresse de notification |
| `societe` | Rich text | Organisation du destinataire |
| `statut` | Select | `Recu`, `Notifie` ou `Remis` |
| `dateReception` | Date | Date et heure de reception |
| `dateNotification` | Date | Date et heure de notification |
| `dateRemise` | Date | Date et heure de remise |
| `notes` | Rich text | Informations complementaires |
| `signature` | Rich text ou fichier | Signature, selon le mode de stockage retenu |
| `id` | Rich text (facultatif) | Identifiant technique si necessaire |

## Règles de contribution et de code

- **Ne pas modifier la fonction `esc()`** dans `public/app.js` sans validation spécifique. Elle échappe les caractères HTML utilisés lors du rendu des données.
- Garder des noms de propriétés, variables d’intégration et clés de schéma sans accents (par exemple `dateReception`). Les libellés affichés à l’écran peuvent rester en français avec accents.
- **Ne jamais exposer le jeton Notion côté client**. Les appels à Notion et les secrets doivent résider dans une fonction/API serveur et être configurés dans les variables d’environnement Vercel.
- Conserver les secrets hors de Git : `.env` et `.env.local` sont ignorés par `.gitignore`; `.env.example` ne contient que des valeurs vides.
- Les fichiers de `public/` sont les sources actuelles de l’interface; éviter d’y introduire des secrets.

## Feuille de route

1. Ajouter des icônes PWA **192×192** et **512×512**, puis compléter les références et métadonnées dans `manifest.json`.
2. Ajouter `sw.js` pour le cache et le fonctionnement hors ligne (à faire; absent pour le moment).
3. Remplacer ou compléter le stockage local par une intégration Notion.
4. Créer `api/` pour les opérations serveur protégées (Notion, paramètres et contrôle d’accès).
5. Relier l’envoi des notifications à Resend.
6. Mettre en place un code d’accès et définir précisément les droits d’accès.
7. Configurer les variables Vercel nécessaires (`NOTION_TOKEN`, `NOTION_DB_ID`, `RESEND_API_KEY`, `APP_KEY`, `MAIL_FROM`, `ORG_NAME`, `PICKUP_ADDRESS`, `PICKUP_HOURS`) uniquement lors de la livraison des fonctions serveur correspondantes.

## Évolutions possibles

- Historique des actions et statistiques de volumes/délais.
- Plusieurs agents avec attribution et droits d’accès.
- Relances, modèles d’e-mail et confirmations d’envoi automatisées.
- Amélioration de l’export, filtres avancés et recherche par date.
- Politique de conservation, sauvegardes et suppression des données personnelles.

## Version téléphone

À compléter plus tard : captures d’écran de la version téléphone et/ou lien vers une démonstration.

- Captures : _à ajouter_
- Lien : _à ajouter_

## Licence

Ce projet est distribué sous licence MIT. Le titulaire des droits dans `LICENSE` est à compléter.
