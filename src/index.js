import 'dotenv/config';
import cron from 'node-cron';
import {
  Client,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
} from 'discord.js';
import { buildMessage } from './message.js';

const {
  DISCORD_TOKEN,
  CLIENT_ID,
  GUILD_ID,
  CHANNEL_ID,
  CRON = '0 9 * * *',
  TIMEZONE = 'Europe/Paris',
} = process.env;

for (const [key, value] of Object.entries({ DISCORD_TOKEN, CLIENT_ID, GUILD_ID, CHANNEL_ID })) {
  if (!value) {
    console.error(`Variable manquante dans .env : ${key}`);
    process.exit(1);
  }
}

const runOnce = process.argv.includes('--now');

async function sendDaily(client) {
  const channel = await client.channels.fetch(CHANNEL_ID);
  await channel.send(await buildMessage());
  console.log(`[${new Date().toISOString()}] Défis envoyés.`);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async (c) => {
  console.log(`Connecté en tant que ${c.user.tag}`);

  if (runOnce) {
    await sendDaily(c);
    await c.destroy();
    return;
  }

  const command = new SlashCommandBuilder()
    .setName('defi')
    .setDescription('Envoie les défis du jour tout de suite');
  await new REST().setToken(DISCORD_TOKEN)
    .put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [command.toJSON()] });

  cron.schedule(CRON, () => sendDaily(c).catch(console.error), { timezone: TIMEZONE });
  console.log(`Planifié : "${CRON}" (${TIMEZONE}). /defi pour déclencher manuellement.`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== 'defi') return;
  await interaction.deferReply({ ephemeral: true });
  await sendDaily(interaction.client);
  await interaction.editReply('Envoyé.');
});

client.login(DISCORD_TOKEN);
