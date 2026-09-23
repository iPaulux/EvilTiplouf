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

### Pourquoi trois crons

GitHub lit le cron en **UTC** et, surtout, ne garantit **pas** l'exécution d'un run planifié : aux heures chargées (l'heure pile en tête) il le retarde, ou l'abandonne sans rien dire.

Le workflow tente donc sa chance trois fois par jour, à des minutes décalées, et c'est `src/post.js` qui décide : il n'envoie que si l'heure locale a atteint `SEND_HOUR` (10h) **et** que rien n'est parti aujourd'hui (`lastDate` dans `data/state.json`). Les tentatives suivantes se terminent en quelques secondes sans rien poster.

Effet de bord appréciable : le passage à l'heure d'hiver est absorbé tout seul. En été c'est le cron de 8h30 UTC qui envoie, en hiver celui de 9h30 — dans les deux cas à 10h30 à Paris, sans toucher au fichier.

Pour changer l'heure d'envoi : la **minute** vient du cron, l'**heure** de `SEND_HOUR` (qui sert de plancher, pas de déclencheur). Pour 10h30 à Paris : crons à `30 8` et `30 9` UTC, `SEND_HOUR: '10'`.

En mode Actions, la commande `/defi` ne fonctionne plus : elle exige un process connecté en permanence. `npm start` reste disponible en local quand tu en veux.

## Alternative : process permanent

Sur un VPS ou un Raspberry Pi : `pm2 start src/index.js --name defis && pm2 save && pm2 startup`. Là, `/defi` fonctionne et l'heure est respectée à la seconde.
