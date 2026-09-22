import { dayNumber, pickNext } from './picker.js';

const TIMEZONE = process.env.TIMEZONE || 'Europe/Paris';
const ROLE_ID = process.env.ROLE_ID;

// Discord refuse un champ d'embed au-delà de 1024 caractères.
const fit = (text) => (text.length <= 1024 ? text : `${text.slice(0, 1010)}…||`);

export async function buildMessage() {
  // Séquentiel : les deux écrivent dans le même state.json.
  const web = await pickNext('web');
  const draw = await pickNext('draw');
  const numero = await dayNumber(TIMEZONE);
  const date = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeZone: TIMEZONE })
    .format(new Date());

  const ping = ROLE_ID ? `<@&${ROLE_ID}> ` : '';

  return {
    content: `${ping}Wesh les pelo c'est l'heure du défis #${numero} ! IA interdite / 30min max`,
    embeds: [{
      color: 0x5865f2,
      title: `Défis #${numero}`,
      description: date,
      fields: [
        {
          name: `💻 Dev web — ${web.titre}`,
          value: fit(`${web.enonce}\n\n**Solution**\n||${web.solution}||`),
        },
        {
          name: `🎨 Dessin — ${draw.sujet}`,
          value: `${draw.focus}\n\n*Poste ton résultat dans le salon resultats, même raté.*`,
        },
      ],
      footer: { text: 'Ouvre le spoiler seulement après avoir essayé.' },
    }],
  };
}
