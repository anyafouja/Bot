process.removeAllListeners('warning');
require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const { Player, QueryType } = require('discord-player');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.MessageContent]
});

// Inisialisasi Player
const player = new Player(client);

// Load Extractors Default + Paket Tambahan
player.extractors.loadDefault();
console.log('Extractors loaded!');

// Slash Commands
const commands = [
    new SlashCommandBuilder().setName('play').setDescription('Putar lagu').addStringOption(option => option.setName('lagu').setDescription('Link atau judul lagu').setRequired(true)),
    new SlashCommandBuilder().setName('skip').setDescription('Lewati lagu'),
    new SlashCommandBuilder().setName('stop').setDescription('Stop musik')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    console.log(`Bot Online: ${client.user.tag}`);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Slash commands registered!');
    } catch (error) { console.error(error); }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName } = interaction;
    const { channel } = interaction.member.voice;

    if (commandName === 'play') {
        const query = interaction.options.getString('lagu');
        if (!channel) return interaction.reply('Masuk VC dulu!');

        await interaction.reply('🔎 Mencari lagu...');

        try {
            const { track } = await player.play(channel, query, {
                queryType: QueryType.AUTO
            });
            await interaction.editReply(`🎶 Memutar: \`${track.title}\``);
        } catch (e) {
            console.log(e);
            return interaction.editReply('❌ Lagu tidak ditemukan atau extractor error.');
        }
    }

    if (commandName === 'skip') {
        const queue = player.queues.get(interaction.guildId);
        if (!queue || !queue.currentTrack) return interaction.reply('Tidak ada lagu.');
        queue.node.skip();
        interaction.reply('⏭️ Skip!');
    }

    if (commandName === 'stop') {
        const queue = player.queues.get(interaction.guildId);
        if (!queue) return interaction.reply('Tidak ada lagu.');
        queue.node.stop();
        interaction.reply('⏹️ Stop!');
    }
});

player.events.on('playerError', (queue, error) => {
    console.error(`Player Error: ${error.message}`);
});

client.login(process.env.TOKEN);
