import { buildMessage } from './message.js';

const url = process.env.DISCORD_WEBHOOK_URL;
if (!url) {
  console.error('DISCORD_WEBHOOK_URL manquant.');
  process.exit(1);
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
