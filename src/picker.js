import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const dataDir = fileURLToPath(new URL('../data/', import.meta.url));
const statePath = `${dataDir}state.json`;

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return fallback;
  }
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const today = (timeZone) =>
  new Intl.DateTimeFormat('fr-CA', { timeZone }).format(new Date());

// Date du dernier envoi, sans rien consommer ni écrire.
export async function lastSentDate() {
  return (await readJson(statePath, {})).lastDate;
}

// Numéro d'édition : +1 au premier envoi de chaque journée, stable si on renvoie le même jour.
export async function dayNumber(timeZone) {
  const date = today(timeZone);
  const state = await readJson(statePath, {});

  if (state.lastDate !== date) {
    state.day = (state.day ?? 0) + 1;
    state.lastDate = date;
    await writeFile(statePath, JSON.stringify(state, null, 2));
  }

  return state.day;
}

// Sac mélangé : on épuise toute la liste avant de recommencer, pas de doublon.
export async function pickNext(name) {
  const items = await readJson(`${dataDir}${name}.json`, []);
  if (items.length === 0) throw new Error(`Aucun défi dans data/${name}.json`);

  const state = await readJson(statePath, {});
  let remaining = state[name];
  if (!Array.isArray(remaining) || remaining.length === 0) {
    remaining = shuffle(items.map((_, i) => i));
  }

  const index = remaining.shift() % items.length;
  state[name] = remaining;
  await writeFile(statePath, JSON.stringify(state, null, 2));

  return items[index];
}
