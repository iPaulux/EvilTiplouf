import { buildMessage } from './message.js';
import { lastSentDate, today } from './picker.js';

const url = process.env.DISCORD_WEBHOOK_URL;
if (!url) {
  console.error('DISCORD_WEBHOOK_URL manquant.');
  process.exit(1);
}

const TIMEZONE = process.env.TIMEZONE || 'Europe/Paris';
const SEND_HOUR = Number(process.env.SEND_HOUR ?? 10);

// GitHub peut retarder ou carrément abandonner un run planifié. On tente donc
// plusieurs fois par jour : ces deux gardes assurent un seul envoi, à la bonne heure
// locale — ce qui absorbe aussi le passage à l'heure d'hiver.
if (process.env.FORCE !== '1') {
  const date = today(TIMEZONE);
  // formatToParts : en fr-FR, format() rend « 10 h », que Number() ne sait pas lire.
  const heure = Number(new Intl.DateTimeFormat('fr-FR', {
    timeZone: TIMEZONE, hour: 'numeric', hour12: false,
  }).formatToParts(new Date()).find((p) => p.type === 'hour').value);

  if (await lastSentDate() === date) {
    console.log(`Déjà envoyé le ${date}. Rien à faire.`);
    process.exit(0);
  }
  if (heure < SEND_HOUR) {
    console.log(`Il est ${heure}h à ${TIMEZONE}, l'envoi est prévu à ${SEND_HOUR}h. Rien à faire.`);
    process.exit(0);
  }
}

const payload = await buildMessage();
const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  // Un webhook ne ping un rôle que si on l'y autorise explicitement.
  body: JSON.stringify({ ...payload, allowed_mentions: { parse: ['roles', 'everyone'] } }),
});

if (!res.ok) {
  console.error(`Discord a refusé (${res.status}) :`, await res.text());
  process.exit(1);
}

console.log(`Défis envoyés — ${payload.embeds[0].title}`);
