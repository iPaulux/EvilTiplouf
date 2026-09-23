# Défi quotidien bot

Bot Discord qui ping un rôle chaque jour avec 2 défis : un mini-exercice de dev web (solution en spoiler) et un objet à dessiner.

## 1. Créer le bot sur Discord

1. https://discord.com/developers/applications → **New Application**, donne-lui un nom.
2. Onglet **Bot** → **Reset Token** → copie le token (il ne s'affiche qu'une fois) → c'est `DISCORD_TOKEN`.
3. Onglet **General Information** → copie l'**Application ID** → c'est `CLIENT_ID`.
4. Onglet **Installation** → *Install Link* : **Discord Provided Link**, scopes `bot` + `applications.commands`, permissions `Send Messages`, `Embed Links`, `Mention @everyone, @here, and All Roles`. Copie le lien, ouvre-le, choisis ton serveur.

## 2. Récupérer les IDs du serveur

Discord → Paramètres → Avancés → active **Mode développeur**. Ensuite clic droit :

- sur le serveur → Copier l'ID du serveur → `GUILD_ID`
- sur le salon des défis → Copier l'ID du salon → `CHANNEL_ID`
- sur le rôle (Paramètres du serveur → Rôles) → Copier l'ID → `ROLE_ID` (optionnel, sinon `@here`)

## 3. Configurer

```bash
cp .env.example .env
```

Remplis les valeurs. `CRON=0 9 * * *` = tous les jours à 9h00 (`0 19 * * *` pour 19h, etc.).

## 4. Lancer

```bash
npm install
npm start          # tourne en continu et poste à l'heure du CRON
npm run test-defi  # envoie un message tout de suite puis quitte
```

En ligne, la commande `/defi` déclenche l'envoi manuellement.

## Ajouter des défis

- `data/web.json` : `{ "titre", "enonce", "solution" }` — `enonce` et `solution` acceptent du markdown Discord (blocs ```` ```js ````, gras, listes). La solution est postée en spoiler. Garde `enonce + solution` sous ~950 caractères : Discord coupe un champ d'embed à 1024.
- `data/draw.json` : `{ "sujet", "focus" }`

Le bot pioche sans doublon : toute la liste est épuisée avant de recommencer (état dans `data/state.json`).

Le titre affiche un numéro d'édition (`Défis #12`) incrémenté **une fois par jour** : relancer plusieurs fois le même jour ne le fait pas bouger. Pour repartir d'un autre numéro, change `day` dans `data/state.json`.

## Envoi automatique via GitHub Actions (sans serveur)

`npm start` s'arrête dès que tu fermes le terminal. Comme le bot n'a besoin de travailler que quelques secondes par jour, le workflow [.github/workflows/defi.yml](.github/workflows/defi.yml) fait le travail gratuitement, sans machine allumée : il poste via un **webhook Discord** (`src/post.js`), pas via la connexion gateway.

1. **Webhook Discord** : salon des défis → Modifier le salon → Intégrations → Webhooks → Nouveau webhook → *Copier l'URL*.
2. **Repo GitHub** : crée un repo **privé** puis, depuis ce dossier :
   ```bash
   git remote add origin git@github.com:<toi>/defi-quotidien-bot.git
   git push -u origin main
   ```
3. **Secrets** : repo → Settings → Secrets and variables → Actions
   - onglet *Secrets* → `DISCORD_WEBHOOK_URL` = l'URL du webhook
   - onglet *Variables* → `ROLE_ID` = l'ID du rôle à ping (facultatif)
4. **Tester** : onglet Actions → *Défi quotidien* → **Run workflow**.

Le workflow recommite `data/state.json` après chaque envoi : c'est ce qui fait avancer le numéro d'édition et le sac anti-doublon d'un jour sur l'autre. Ne le supprime pas du repo.

### Le déclencheur : un cron externe

Le planificateur de GitHub n'a jamais déclenché le moindre run sur ce dépôt, même avec un cron toutes les 10 minutes (les crons Actions sont du « best effort », sans garantie contractuelle). L'envoi est donc piloté de l'extérieur, par [cron-job.org](https://cron-job.org) :

| Champ | Valeur |
|---|---|
| URL | `https://api.github.com/repos/iPaulux/EvilTiplouf/actions/workflows/defi.yml/dispatches` |
| Méthode | `POST` |
| En-têtes | `Authorization: Bearer <TOKEN>`<br>`Accept: application/vnd.github+json`<br>`X-GitHub-Api-Version: 2022-11-28` |
| Corps | `{"ref":"main"}` |
| Horaire | tous les jours à 10:30, fuseau `Europe/Paris` |

Le token est un **fine-grained PAT** limité à ce seul dépôt, avec la permission *Actions : Read and write* et rien d'autre. Réponse attendue de GitHub : `204 No Content`.

Comme l'appel ne passe pas l'input `force`, les gardes de `src/post.js` s'appliquent : un réessai ne poste jamais deux fois. Seule la case *force* cochée dans l'interface GitHub contourne les gardes.

### Les crons natifs, en filet

Les trois `schedule` du workflow restent en place au cas où GitHub se réveillerait : ils sont en **UTC** (8h30 l'été, 9h30 l'hiver = 10h30 à Paris) et ne peuvent pas créer de doublon grâce aux gardes.

Ces gardes, dans `src/post.js` : l'envoi n'a lieu que si l'heure locale a atteint `SEND_HOUR` (10h) **et** que rien n'est parti aujourd'hui (`lastDate` dans `data/state.json`). Tout le reste se termine en deux secondes sans rien poster.

C'est aussi ce qui absorbe le changement d'heure : `SEND_HOUR` est comparé à l'heure de Paris, pas à l'heure UTC.

Pour changer l'heure d'envoi : c'est l'horaire de **cron-job.org** qui décide de la minute, et `SEND_HOUR` qui sert de plancher. Si tu veux envoyer avant 10h, baisse aussi `SEND_HOUR`, sinon le script refusera.

En mode Actions, la commande `/defi` ne fonctionne plus : elle exige un process connecté en permanence. `npm start` reste disponible en local quand tu en veux.

## Alternative : process permanent

Sur un VPS ou un Raspberry Pi : `pm2 start src/index.js --name defis && pm2 save && pm2 startup`. Là, `/defi` fonctionne et l'heure est respectée à la seconde.
