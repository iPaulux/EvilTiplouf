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

## Garder le bot allumé

`npm start` s'arrête si tu fermes le terminal. Pour du 24/7 : un petit VPS, Railway/Fly.io, ou un Raspberry Pi, avec `pm2 start src/index.js --name defis`.
